// Base interface for flower sample
export interface FlowerSample {
  id: number;
  sample_id: string;          // Unique identifier like "FS-2026-001"
  title: string;              // "Spring Rose Delight"
  description: string;        // Detailed description
  types: string[];            // ["rose", "hybrid", "perennial"]
  colors: string[];           // ["red", "pink", "white"]
  sizes: number[];            // [10, 20, 30] in cm or inches
  images: Image[];            // Array of image objects
  created_at: Date;
  updated_at: Date;
}

// Image structure
export interface Image {
  id?: number;
  url: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

// DTO for creating new flower sample
export interface CreateFlowerSampleDTO {
  title: string;
  description: string;
  types: string[];
  colors: string[];
  sizes: number[];
  images?: Partial<Image>[];
}

// Database record type
export interface FlowerSampleRecord extends RowDataPacket {
  id: number;
  sample_id: string;
  title: string;
  description: string;
  types: string;              // JSON string in DB
  colors: string;             // JSON string in DB
  sizes: string;              // JSON string in DB
  images: string;             // JSON string in DB
  created_at: Date;
  updated_at: Date;
}