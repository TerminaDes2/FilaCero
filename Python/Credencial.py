import cv2
import pytesseract
import numpy as np
import re
from fuzzywuzzy import fuzz
import sys
import json
from pathlib import Path

# Si Tesseract no está en PATH, descomenta y ajusta:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Regex para número de alumno (ajusta según formato real)
STUDENT_ID_REGEX = r'\b\d{8}\b'  # ejemplo: 20210974

# Ruta del cascade Haar para detección facial incluida en OpenCV
FACE_CASCADE = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_detector = cv2.CascadeClassifier(FACE_CASCADE)

def preprocess_for_ocr(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Contrast stretching
    p2, p98 = np.percentile(gray, (2, 98))
    gray = np.clip((gray - p2) * 255.0 / (p98 - p2 + 1e-6), 0, 255).astype(np.uint8)
    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    # Optional adaptive threshold can help on plastic cards
    # bin_img = cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    #                                cv2.THRESH_BINARY,11,2)
    return gray

def ocr_data(img, lang='spa'):
    # returns pytesseract TSV data
    config = '--psm 6'  # assumes a block of text; try different psm if needed
    data = pytesseract.image_to_data(img, lang=lang, config=config, output_type=pytesseract.Output.DICT)
    return data

def best_rotation_image(img):
    # Try rotations 0,90,180,270 and pick the one with highest avg conf and number of words
    best = None
    best_score = -1
    for k in range(4):
        rot = np.rot90(img, k)
        prep = preprocess_for_ocr(rot)
        d = ocr_data(prep)
        # Score: count words with conf > 40
        confs = [int(c) for c in d['conf'] if c != '-1']
        num_good = sum(1 for c in confs if c > 40)
        score = num_good
        if score > best_score:
            best_score = score
            best = rot.copy()
    return best

def extract_text_blocks(img):
    prep = preprocess_for_ocr(img)
    d = ocr_data(prep)
    texts = []
    n = len(d['text'])
    for i in range(n):
        txt = d['text'][i].strip()
        if not txt:
            continue
        conf = int(d['conf'][i]) if d['conf'][i] != '-1' else 0
        x, y, w, h = d['left'][i], d['top'][i], d['width'][i], d['height'][i]
        texts.append({'text': txt, 'conf': conf, 'box': (x,y,w,h)})
    return texts

def find_universidad(texts):
    # Look for "UNIVERSIDAD" and "COLIMA" near each other or the exact phrase
    full = " ".join([t['text'] for t in texts]).upper()
    if "UNIVERSIDAD DE COLIMA" in full:
        return True
    # fallback: both words present
    return ("UNIVERSIDAD" in full) and ("COLIMA" in full)

def find_student_id(texts):
    # join and search for pattern; also check per token
    joined = " ".join([t['text'] for t in texts])
    m = re.search(STUDENT_ID_REGEX, joined)
    if m:
        return m.group(0)
    # fallback: check tokens that look numeric
    for t in texts:
        if re.fullmatch(r'\d{7,9}', t['text']):
            return t['text']
    return None

def guess_name(texts):
    # Heuristic: find all tokens which are all-caps or alphabetic and length>2, group consecutive tokens
    words = [t['text'] for t in texts]
    candidates = []
    i=0
    while i < len(words):
        if re.fullmatch(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}', words[i]):
            j=i
            seq=[words[j]]
            j+=1
            while j < len(words) and re.fullmatch(r'[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}', words[j]):
                seq.append(words[j]); j+=1
            if len(seq) >= 2:  # at least first+last name
                candidates.append(" ".join(seq))
            i=j
        else:
            i+=1
    # choose longest candidate by words
    if candidates:
        candidates.sort(key=lambda s: len(s.split()), reverse=True)
        return candidates[0]
    return None

def detect_photo(img):
    # Try face detection in right-bottom quadrant or whole image if unknown
    h,w = img.shape[:2]
    # Try typical photo region (bottom-right quadrant) first
    regions = [
        img[int(h*0.45):h, int(w*0.55):w],
        img[int(h*0.2):int(h*0.8), int(w*0.05):int(w*0.5)],  # left area as fallback
        img
    ]
    for region in regions:
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30,30))
        if len(faces) > 0:
            return True
    return False

def validate_card(image_path, expected_student_id=None, expected_name=None):
    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(image_path)
    # Fix rotation
    img = best_rotation_image(img)

    texts = extract_text_blocks(img)
    universidad_ok = find_universidad(texts)
    student_id = find_student_id(texts)
    name_guess = guess_name(texts)
    photo_ok = detect_photo(img)

    result = {
        'universidad_found': universidad_ok,
        'student_id_extracted': student_id,
        'student_name_extracted': name_guess,
        'photo_detected': photo_ok,
        'raw_text_joined': " ".join([t['text'] for t in texts])
    }

    # If expected values provided, compare (fuzzy for name)
    if expected_student_id:
        result['student_id_match'] = (student_id == expected_student_id)
    if expected_name and name_guess:
        # fuzzy match
        score = fuzz.token_set_ratio(expected_name.upper(), name_guess.upper())
        result['student_name_match_score'] = score
        result['student_name_match'] = score >= 85  # threshold
    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python validate_univ_card.py tarjeta.jpg [expected_student_id] [expected_name]")
        sys.exit(1)
    img_path = Path(sys.argv[1])
    expected_id = sys.argv[2] if len(sys.argv) > 2 else None
    expected_name = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else None

    res = validate_card(img_path, expected_id, expected_name)
    print(json.dumps(res, indent=2, ensure_ascii=False))
