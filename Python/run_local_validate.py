import sys
import json
from pathlib import Path

from Credencial import validate_card


def main():
    if len(sys.argv) < 2:
        print('Uso: python run_local_validate.py <ruta_imagen> [expected_student_id] [expected_name]')
        sys.exit(1)
    img = Path(sys.argv[1])
    expected_id = sys.argv[2] if len(sys.argv) > 2 else None
    expected_name = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else None

    res = validate_card(img, expected_id, expected_name)
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
