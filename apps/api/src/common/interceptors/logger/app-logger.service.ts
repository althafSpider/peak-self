import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLoggerService {
  constructor(
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  log(message: string, context?: string, meta?: object) {
    this.logger.info(
      {
        ...meta,
        context,
      },
      message,
    );
  }

  error(message: string, trace?: string, meta?: object) {
    this.logger.error(
      {
        trace,
        ...meta,
      },
      message,
    );
  }

  warn(message: string, meta?: object) {
    this.logger.warn(meta || {}, message);
  }
}
