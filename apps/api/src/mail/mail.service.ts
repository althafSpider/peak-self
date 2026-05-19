import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly emailFrom: string;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    const emailFrom = this.configService.get<string>("EMAIL_FROM");

    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY");
    }
    if (!emailFrom) {
      throw new Error("Missing EMAIL_FROM");
    }

    this.resend = new Resend(apiKey);
    this.emailFrom = emailFrom;
  }

  async sendMagicLink(
    email: string,
    url: string,
  ) {
    const result = await this.resend.emails.send({
      from: this.emailFrom,

      to: email,

      subject: "Login to Peakself",

      html: `
        <h2>Login to Peakself</h2>

        <a href="${url}">
          Continue
        </a>
      `,
    });

    this.logger.log(
      `Magic link email send result for ${email}: ${JSON.stringify(result)}`,
    );

    return result;
  }
}
