interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
  totalItems: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  coverImage?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
}

class GoogleBooksService {
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
  }

  private async makeRequest(url: string): Promise<GoogleBooksResponse> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching from Google Books API:', error);
      throw error;
    }
  }

  public async searchBooks(query: string, maxResults: number = 10): Promise<BookMetadata[]> {
    if (!this.apiKey) {
      console.warn('Google Books API key not provided');
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}?q=${encodedQuery}&maxResults=${maxResults}&key=${this.apiKey}`;
      
      const response = await this.makeRequest(url);
      
      if (!response.items) {
        return [];
      }

      return response.items.map(item => this.mapToBookMetadata(item));
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }

  public async getBookByISBN(isbn: string): Promise<BookMetadata | null> {
    if (!this.apiKey) {
      console.warn('Google Books API key not provided');
      return null;
    }

    try {
      const query = `isbn:${isbn}`;
      const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&maxResults=1&key=${this.apiKey}`;
      
      const response = await this.makeRequest(url);
      
      if (!response.items || response.items.length === 0) {
        return null;
      }

      return this.mapToBookMetadata(response.items[0]);
    } catch (error) {
      console.error('Error fetching book by ISBN:', error);
      return null;
    }
  }

  private mapToBookMetadata(item: GoogleBooksItem): BookMetadata {
    const { volumeInfo } = item;
    
    // Extract ISBN
    let isbn = '';
    if (volumeInfo.industryIdentifiers) {
      const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10');
      isbn = isbn13?.identifier || isbn10?.identifier || '';
    }

    return {
      title: volumeInfo.title || '',
      author: volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volumeInfo.description || '',
      isbn,
      coverImage: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
      publishedDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      categories: volumeInfo.categories,
      language: volumeInfo.language
    };
  }

  public async enrichBookData(bookData: Partial<BookMetadata>): Promise<BookMetadata> {
    // If we have an ISBN, try to get data from Google Books
    if (bookData.isbn) {
      const googleData = await this.getBookByISBN(bookData.isbn);
      if (googleData) {
        return {
          ...googleData,
          ...bookData, // User data takes precedence
        };
      }
    }

    // If we have a title and author, try to search
    if (bookData.title && bookData.author) {
      const searchQuery = `${bookData.title} ${bookData.author}`;
      const searchResults = await this.searchBooks(searchQuery, 1);
      
      if (searchResults.length > 0) {
        return {
          ...searchResults[0],
          ...bookData, // User data takes precedence
        };
      }
    }

    // Return original data if no enrichment found
    return bookData as BookMetadata;
  }
}

export const googleBooksService = new GoogleBooksService();
export default googleBooksService;
