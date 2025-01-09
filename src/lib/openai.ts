interface AnalysisResult {
  category: string;
  tags: string[];
}

export async function analyzeNote(content: string): Promise<AnalysisResult> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-note', {
      body: { content }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error calling analyze-note function:', error);
    throw new Error('Failed to analyze note');
  }
}