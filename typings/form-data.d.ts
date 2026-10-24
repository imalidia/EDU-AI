declare module 'form-data' {
  class FormData {
    append(name: string, value: any, options?: any): void;
    getHeaders(): Record<string, string>;
    getBuffer(): Buffer;
    getBoundary(): string;
    hasKnownLength(): boolean;
    getLengthSync(): number;
    getLength(callback: (err: Error, length: number) => void): void;
    submit(params: string | URL, callback: (err: Error, res: any) => void): any;
  }
  
  namespace FormData {}
  export = FormData;
} 