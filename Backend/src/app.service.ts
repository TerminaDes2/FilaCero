import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  async getHealth() {
    return {
      status: 'ok',
      framework: 'nest',
      time: new Date().toISOString(),
    };
  }
}
