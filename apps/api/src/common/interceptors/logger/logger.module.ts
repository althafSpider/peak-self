import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppLoggerService } from './app-logger.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: false,
                  colorize: true,

                },
              }
            : undefined,

        customProps: (req:any) => ({
          context: 'HTTP',
          userId: req.user?.id || null,
        }),

        serializers: {
          req(req) {
            return {
              method: req.method,
              url: req.url,
              userAgent: req.headers['user-agent'],
            };
          },

          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class AppLoggerModule {}