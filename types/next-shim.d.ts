declare module 'next/navigation' {
  export function redirect(url: string): never;
  export function notFound(): never;
  export function useRouter(): any;
  export function usePathname(): string;
  export function useSearchParams(): any;
}

declare module 'next/headers' {
  export function cookies(): Promise<{ get: (name: string) => { value: string } | undefined }>;
  export function headers(): Promise<{ get: (name: string) => string | null }>;
}

declare module 'next/server' {
  export class NextRequest {
    headers: Headers;
    nextUrl: URL;
    json(): Promise<any>;
    method: string;
    url: string;
  }
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
      delete(name: string, options?: any): void;
    };
  }
}
