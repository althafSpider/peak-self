import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((responseData) => {
        const statusCode =
          response.statusCode || HttpStatus.OK;

        return {
          statusCode,
          message:
            responseData?.message ||
            this.getDefaultMessage(statusCode),
          data:
            responseData?.data !== undefined
              ? responseData.data
              : responseData,
        };
      }),
    );
  }

  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.OK:
        return 'Success';

      case HttpStatus.CREATED:
        return 'Resource created successfully';

      case HttpStatus.ACCEPTED:
        return 'Request accepted';

      case HttpStatus.NO_CONTENT:
        return 'No content';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.BAD_REQUEST:
        return 'Bad request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not found';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal server error';
      default:
        return 'Internal server error';
    }
  }
}