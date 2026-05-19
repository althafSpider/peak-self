import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Profile, Strategy, StrategyOptions } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(@Inject(ConfigService) configService: ConfigService) {
    const clientID = configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = configService.get<string>("GOOGLE_CLIENT_SECRET");
    const callbackURL = configService.get<string>("GOOGLE_CALLBACK_URL");

    if (!clientID) throw new Error("Missing GOOGLE_CLIENT_ID");
    if (!clientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET");
    if (!callbackURL) throw new Error("Missing GOOGLE_CALLBACK_URL");

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    } as StrategyOptions);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;

    return {
      email,
      googleId: profile.id,
      name: profile.displayName,
      image: profile.photos?.[0]?.value,
    };
  }
}
