export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pc_samples: {
        Row: {
          sample_id: string;
          condition: string;
          cohort: string;
          gleason: string | null;
          condition_grade: string;
          group_label: string | null;
        };
      };
      pc_comparisons: {
        Row: {
          slug: string;
          label: string;
          description: string | null;
          sort_order: number | null;
        };
      };
      pc_deg: {
        Row: {
          id: number;
          comparison_slug: string;
          ensembl_id: string | null;
          gene_name: string;
          base_mean: number | null;
          log2_fold_change: number;
          padj: number;
          direction: string;
        };
      };
      pc_fgsea: {
        Row: {
          id: number;
          comparison_slug: string;
          pathway: string;
          nes: number | null;
          padj: number | null;
          pval: number | null;
          size: number | null;
        };
      };
      pc_progeny: {
        Row: {
          id: number;
          sample_id: string;
          pathway: string;
          score: number;
        };
      };
      pc_estimate: {
        Row: {
          sample_id: string;
          stroma_score: number | null;
          immune_score: number | null;
          estimate_score: number | null;
          tumor_purity: number | null;
        };
      };
      pc_dashboard_meta: {
        Row: {
          key: string;
          value: string;
          updated_at: string | null;
        };
      };
    };
  };
}

export type Sample = Database["public"]["Tables"]["pc_samples"]["Row"];
export type Comparison = Database["public"]["Tables"]["pc_comparisons"]["Row"];
export type DegRow = Database["public"]["Tables"]["pc_deg"]["Row"];
export type FgseaRow = Database["public"]["Tables"]["pc_fgsea"]["Row"];
export type ProgenyRow = Database["public"]["Tables"]["pc_progeny"]["Row"];
export type EstimateRow = Database["public"]["Tables"]["pc_estimate"]["Row"];
