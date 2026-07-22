declare module "ssl-checker" {
  export type SslCheckerOptions = {
    method?: string;
    port?: number;
  };

  export type SslCheckerResult = {
    valid: boolean;
    daysRemaining: number;
    validFrom: string;
    validTo: string;
    validFor: string[];
  };

  export default function sslChecker(
    host: string,
    options?: SslCheckerOptions
  ): Promise<SslCheckerResult>;
}