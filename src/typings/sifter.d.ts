declare module 'sifter' {
  interface SifterOptions {
    fields: Array<string | { field: string; weight?: number }>;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
    conjunction?: 'and' | 'or';
  }

  interface SifterResult {
    items: Array<{ 
      id: number;
      score: number;
    }>;
    options: SifterOptions;
    query: string;
    tokens: Array<{
      string: string;
      regex: RegExp;
    }>;
    total: number;
  }

  class Sifter {
    constructor(items: any[]);
    search(query: string, options: SifterOptions): SifterResult;
  }

  export = Sifter;
} 