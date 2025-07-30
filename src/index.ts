import * as fs from 'fs';
import * as path from 'path';

// Tool interface definition
interface ClankerTool {
  name: string;
  description: string;
  version: string;
  author: string;
  args: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
    default?: any;
  }[];
  capabilities?: string[];
  tags?: string[];
  execute: (args: any, context?: any) => Promise<{ success: boolean; output?: string; error?: string; data?: any }>;
}

// Summarization modes
const SummaryMode = {
  AUTO: 'auto',
  BRIEF: 'brief',
  DETAILED: 'detailed',
  BULLET_POINTS: 'bullet_points',
  KEY_INSIGHTS: 'key_insights',
  ACTION_ITEMS: 'action_items',
  TECHNICAL: 'technical',
  EXECUTIVE: 'executive',
  CREATIVE: 'creative',
  ACADEMIC: 'academic',
  CONVERSATIONAL: 'conversational',
  QUESTIONS: 'questions',
  PROS_CONS: 'pros_cons',
  TIMELINE: 'timeline',
  COMPARISON: 'comparison'
} as const;

// Output formats
const OutputFormat = {
  MARKDOWN: 'markdown',
  PLAIN: 'plain',
  JSON: 'json',
  HTML: 'html',
  OUTLINE: 'outline'
} as const;

const tool: ClankerTool = {
  name: 'summarize',
  description: 'Intelligently summarize any content with various abstraction levels, modes, and output formats. Can extract insights, action items, key points, or create custom summaries based on your needs.',
  version: '1.1.0',
  author: 'Clanker Team',
  tags: ['summarize', 'abstract', 'analysis', 'extract', 'insights', 'ai', 'flexible'],
  capabilities: ['file-read', 'ai-access'],
  args: [
    {
      name: 'text',
      type: 'string',
      description: 'The content to summarize (can be any text, code, logs, etc.)',
      required: false
    },
    {
      name: 'file',
      type: 'string',
      description: 'Path to file to summarize (alternative to text)',
      required: false
    },
    {
      name: 'mode',
      type: 'string',
      description: 'Summarization mode: auto, brief, detailed, bullet_points, key_insights, action_items, technical, executive, creative, academic, conversational, questions, pros_cons, timeline, comparison',
      required: false,
      default: 'auto'
    },
    {
      name: 'format',
      type: 'string',
      description: 'Output format: markdown, plain, json, html, outline',
      required: false,
      default: 'markdown'
    },
    {
      name: 'instructions',
      type: 'string',
      description: 'Custom instructions for summarization',
      required: false
    },
    {
      name: 'max_length',
      type: 'number',
      description: 'Maximum length of summary in words (0 = no limit)',
      required: false,
      default: 0
    },
    {
      name: 'language',
      type: 'string',
      description: 'Language for the summary output',
      required: false,
      default: 'english'
    },
    {
      name: 'include_quotes',
      type: 'boolean',
      description: 'Include relevant quotes from source',
      required: false,
      default: false
    },
    {
      name: 'include_stats',
      type: 'boolean',
      description: 'Include statistics about the content',
      required: false,
      default: false
    },
    {
      name: 'focus',
      type: 'string',
      description: 'Specific aspect to focus on',
      required: false
    },
    {
      name: 'abstraction_level',
      type: 'number',
      description: 'Level of abstraction (1-5, where 1 is very concrete and 5 is very abstract)',
      required: false,
      default: 3
    }
  ],
  execute: async (args: any, context?: any) => {
    const {
      text,
      file,
      mode = 'auto',
      format = 'markdown',
      instructions,
      max_length = 0,
      language = 'english',
      include_quotes = false,
      include_stats = false,
      focus,
      abstraction_level = 3
    } = args;

    // Validate input
    if (!text && !file) {
      return {
        success: false,
        error: 'Either text or file parameter must be provided'
      };
    }

    if (text && file) {
      return {
        success: false,
        error: 'Cannot provide both text and file parameters'
      };
    }

    if (abstraction_level < 1 || abstraction_level > 5) {
      return {
        success: false,
        error: 'Abstraction level must be between 1 (very concrete) and 5 (very abstract)'
      };
    }

    let contentToSummarize = text || '';

    // Read file if provided
    if (file) {
      try {
        const cwd = context?.cwd || process.cwd();
        const resolvedPath = path.resolve(cwd, file);
        if (!fs.existsSync(resolvedPath)) {
          return {
            success: false,
            error: `File not found: ${file}`
          };
        }
        contentToSummarize = fs.readFileSync(resolvedPath, 'utf-8');
      } catch (error) {
        return {
          success: false,
          error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }

    // Perform summarization
    const analysis = analyzeContent(contentToSummarize);
    let summary = '';

    // Generate summary based on mode
    switch (mode) {
      case 'brief':
        summary = generateBriefSummary(analysis, abstraction_level);
        break;
      case 'detailed':
        summary = generateDetailedSummary(analysis, abstraction_level);
        break;
      case 'bullet_points':
        summary = generateBulletPoints(analysis, focus);
        break;
      case 'key_insights':
        summary = generateKeyInsights(analysis, abstraction_level);
        break;
      case 'action_items':
        summary = generateActionItems(analysis);
        break;
      case 'technical':
        summary = generateTechnicalSummary(analysis, abstraction_level);
        break;
      case 'executive':
        summary = generateExecutiveSummary(analysis);
        break;
      case 'questions':
        summary = generateQuestions(analysis);
        break;
      case 'pros_cons':
        summary = generateProsConsList(analysis);
        break;
      case 'timeline':
        summary = generateTimeline(analysis);
        break;
      case 'creative':
        summary = generateCreativeSummary(analysis, instructions);
        break;
      case 'academic':
        summary = generateAcademicSummary(analysis);
        break;
      case 'conversational':
        summary = generateConversationalSummary(analysis);
        break;
      case 'comparison':
        summary = generateComparisonSummary(analysis);
        break;
      default:
        summary = generateAutoSummary(analysis, abstraction_level, instructions);
    }

    // Apply focus filter if specified
    if (focus) {
      summary = applyFocusFilter(summary, focus, analysis);
    }

    // Add quotes if requested
    if (include_quotes) {
      const quotes = extractRelevantQuotes(contentToSummarize, summary);
      summary = appendQuotes(summary, quotes, format);
    }

    // Add statistics if requested
    if (include_stats) {
      const stats = generateStats(contentToSummarize);
      summary = appendStats(summary, stats, format);
    }

    // Format output
    const formattedSummary = formatOutput(summary, format, mode);

    // Trim to max length if specified
    if (max_length > 0) {
      formattedSummary.content = trimToWordLimit(formattedSummary.content, max_length);
    }

    return {
      success: true,
      output: formattedSummary.content,
      data: {
        mode,
        format,
        abstractionLevel: abstraction_level,
        originalLength: contentToSummarize.length,
        summaryLength: formattedSummary.content.length,
        compressionRatio: Math.round((1 - formattedSummary.content.length / contentToSummarize.length) * 100),
        source: file ? `file: ${file}` : 'text input',
        method: 'pattern-based',
        metadata: formattedSummary.metadata
      }
    };
  }
};

// Helper interfaces
interface ContentAnalysis {
  sentences: string[];
  paragraphs: string[];
  sections: Map<string, string[]>;
  keywords: Map<string, number>;
  entities: string[];
  dates: string[];
  numbers: string[];
  codeBlocks: string[];
  lists: string[][];
  questions: string[];
  actionableItems: string[];
}

// Content analysis function
function analyzeContent(text: string): ContentAnalysis {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  
  // Extract sections
  const sections = new Map<string, string[]>();
  let lastSection = 'Introduction';
  
  text.split('\n').forEach(line => {
    const sectionMatch = line.match(/^#{1,6}\s+(.+)$|^(.+):$/);
    if (sectionMatch) {
      lastSection = sectionMatch[1] || sectionMatch[2];
      sections.set(lastSection, []);
    } else if (line.trim()) {
      const current = sections.get(lastSection) || [];
      current.push(line);
      sections.set(lastSection, current);
    }
  });

  // Extract keywords (simple frequency analysis)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const keywords = new Map<string, number>();
  words.forEach(word => {
    if (!isCommonWord(word)) {
      keywords.set(word, (keywords.get(word) || 0) + 1);
    }
  });

  // Extract entities, dates, numbers
  const entities = extractEntities(text);
  const dates = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi) || [];
  const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];

  // Extract code blocks
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];

  // Extract lists
  const lists = extractLists(text);

  // Extract questions
  const questions = sentences.filter(s => s.trim().endsWith('?'));

  // Extract actionable items
  const actionableItems = extractActionableItems(sentences);

  return {
    sentences,
    paragraphs,
    sections,
    keywords,
    entities,
    dates,
    numbers,
    codeBlocks,
    lists,
    questions,
    actionableItems
  };
}

// Summary generation functions
function generateBriefSummary(analysis: ContentAnalysis, abstractionLevel: number): string {
  const keyPoints = extractKeyPoints(analysis, 3);
  return keyPoints.join(' ');
}

function generateDetailedSummary(analysis: ContentAnalysis, abstractionLevel: number): string {
  const sections: string[] = [];
  
  analysis.sections.forEach((content, title) => {
    if (content.length > 0) {
      sections.push(`**${title}**\n${content.slice(0, 3).join(' ')}`);
    }
  });
  
  return sections.slice(0, 5).join('\n\n');
}

function generateBulletPoints(analysis: ContentAnalysis, focus?: string): string {
  const points = extractKeyPoints(analysis, 10, focus);
  return points.map(p => `• ${p}`).join('\n');
}

function generateKeyInsights(analysis: ContentAnalysis, abstractionLevel: number): string {
  const insights: string[] = [];
  
  // Top keywords indicate main themes
  const topKeywords = Array.from(analysis.keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  if (topKeywords.length > 0) {
    insights.push(`Main themes: ${topKeywords.join(', ')}`);
  }
  
  // Patterns in data
  if (analysis.numbers.length > 5) {
    insights.push('Contains significant quantitative data');
  }
  
  if (analysis.questions.length > 3) {
    insights.push('Raises multiple questions for consideration');
  }
  
  if (analysis.codeBlocks.length > 0) {
    insights.push('Includes technical implementation details');
  }
  
  return insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n');
}

function generateActionItems(analysis: ContentAnalysis): string {
  if (analysis.actionableItems.length === 0) {
    return 'No explicit action items found.';
  }
  
  return analysis.actionableItems
    .slice(0, 10)
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n');
}

function generateTechnicalSummary(analysis: ContentAnalysis, abstractionLevel: number): string {
  const parts: string[] = [];
  
  if (analysis.codeBlocks.length > 0) {
    parts.push(`**Code Examples**: ${analysis.codeBlocks.length} code blocks found`);
  }
  
  const technicalTerms = Array.from(analysis.keywords.entries())
    .filter(([word]) => isTechnicalTerm(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (technicalTerms.length > 0) {
    parts.push(`**Technical concepts**: ${technicalTerms.map(([w]) => w).join(', ')}`);
  }
  
  const implementation = analysis.sentences.filter(s => 
    /implement|algorithm|function|method|class|interface|api/i.test(s)
  ).slice(0, 3);
  
  if (implementation.length > 0) {
    parts.push(`**Implementation details**:\n${implementation.join(' ')}`);
  }
  
  return parts.join('\n\n');
}

function generateExecutiveSummary(analysis: ContentAnalysis): string {
  const parts: string[] = [];
  
  // Overview
  if (analysis.paragraphs.length > 0) {
    parts.push(`**Overview**: ${analysis.paragraphs[0].substring(0, 200)}...`);
  }
  
  // Key metrics
  if (analysis.numbers.length > 0) {
    parts.push(`**Key Metrics**: ${analysis.numbers.slice(0, 5).join(', ')}`);
  }
  
  // Recommendations
  const recommendations = analysis.sentences.filter(s => 
    /recommend|suggest|should|propose|advise/i.test(s)
  ).slice(0, 3);
  
  if (recommendations.length > 0) {
    parts.push(`**Recommendations**:\n${recommendations.map(r => `• ${r.trim()}`).join('\n')}`);
  }
  
  return parts.join('\n\n');
}

function generateQuestions(analysis: ContentAnalysis): string {
  const questions = analysis.questions.length > 0 
    ? analysis.questions 
    : generateImpliedQuestions(analysis);
  
  return questions
    .slice(0, 5)
    .map((q, i) => `${i + 1}. ${q.trim()}`)
    .join('\n');
}

function generateProsConsList(analysis: ContentAnalysis): string {
  const pros: string[] = [];
  const cons: string[] = [];
  
  analysis.sentences.forEach(sentence => {
    if (/advantage|benefit|positive|improve|enhance|efficient/i.test(sentence)) {
      pros.push(sentence.trim());
    } else if (/disadvantage|drawback|negative|issue|problem|challenge/i.test(sentence)) {
      cons.push(sentence.trim());
    }
  });
  
  let result = '**Pros:**\n';
  result += pros.slice(0, 5).map(p => `• ${p}`).join('\n');
  result += '\n\n**Cons:**\n';
  result += cons.slice(0, 5).map(c => `• ${c}`).join('\n');
  
  return result;
}

function generateTimeline(analysis: ContentAnalysis): string {
  if (analysis.dates.length === 0) {
    return 'No temporal information found for timeline generation.';
  }
  
  // Group sentences by dates
  const timeline: string[] = [];
  
  analysis.dates.forEach(date => {
    const relatedSentences = analysis.sentences.filter(s => s.includes(date));
    if (relatedSentences.length > 0) {
      timeline.push(`**${date}**: ${relatedSentences[0].trim()}`);
    }
  });
  
  return timeline.join('\n');
}

function generateCreativeSummary(analysis: ContentAnalysis, instructions?: string): string {
  const keyElements = extractKeyPoints(analysis, 5);
  const narrative = keyElements.join(' Meanwhile, ').replace(/\. Meanwhile,/g, '. Meanwhile,');
  
  return `In this narrative, we discover that ${narrative.toLowerCase()} This journey reveals the interconnected nature of these elements.`;
}

function generateAcademicSummary(analysis: ContentAnalysis): string {
  const thesis = analysis.paragraphs[0] ? analysis.paragraphs[0].substring(0, 150) : 'The text presents multiple concepts.';
  const evidence = extractKeyPoints(analysis, 3);
  const conclusion = analysis.paragraphs[analysis.paragraphs.length - 1] 
    ? analysis.paragraphs[analysis.paragraphs.length - 1].substring(0, 150) 
    : 'Further research is warranted.';
  
  return `**Thesis**: ${thesis}\n\n**Evidence**:\n${evidence.map(e => `• ${e}`).join('\n')}\n\n**Conclusion**: ${conclusion}`;
}

function generateConversationalSummary(analysis: ContentAnalysis): string {
  const points = extractKeyPoints(analysis, 5);
  return `So basically, here's what we're looking at: ${points[0]} Also worth noting that ${points[1]} And get this - ${points[2] || 'there are some interesting details here.'}`;
}

function generateComparisonSummary(analysis: ContentAnalysis): string {
  const aspects: string[] = [];
  
  // Look for comparison indicators
  const comparisons = analysis.sentences.filter(s => 
    /compared to|versus|unlike|similar to|different from|contrast/i.test(s)
  );
  
  if (comparisons.length > 0) {
    aspects.push(`**Direct Comparisons**:\n${comparisons.slice(0, 3).map(c => `• ${c.trim()}`).join('\n')}`);
  }
  
  // Look for pros/cons pattern
  const prosConsResult = generateProsConsList(analysis);
  if (prosConsResult !== '**Pros:**\n\n\n**Cons:**\n') {
    aspects.push(prosConsResult);
  }
  
  return aspects.join('\n\n') || 'No clear comparisons found in the text.';
}

function generateAutoSummary(analysis: ContentAnalysis, abstractionLevel: number, instructions?: string): string {
  // Intelligent auto mode based on content
  if (analysis.actionableItems.length > 5) {
    return generateActionItems(analysis);
  } else if (analysis.codeBlocks.length > 2) {
    return generateTechnicalSummary(analysis, abstractionLevel);
  } else if (analysis.numbers.length > 10) {
    return generateExecutiveSummary(analysis);
  } else {
    return generateDetailedSummary(analysis, abstractionLevel);
  }
}

// Utility functions
function extractKeyPoints(analysis: ContentAnalysis, count: number, focus?: string): string[] {
  let sentences = [...analysis.sentences];
  
  // Filter by focus if provided
  if (focus) {
    sentences = sentences.filter(s => s.toLowerCase().includes(focus.toLowerCase()));
  }
  
  // Score sentences by importance
  const scored = sentences.map(sentence => {
    let score = 0;
    
    // Length preference
    if (sentence.length > 50 && sentence.length < 200) score += 2;
    
    // Contains numbers
    if (/\d+/.test(sentence)) score += 1;
    
    // Contains keywords
    analysis.keywords.forEach((count, keyword) => {
      if (sentence.toLowerCase().includes(keyword)) {
        score += Math.min(count, 3);
      }
    });
    
    // Position bonus (earlier sentences often more important)
    const position = analysis.sentences.indexOf(sentence);
    if (position < 5) score += 2;
    
    return { sentence, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.sentence.trim());
}

function extractEntities(text: string): string[] {
  // Simple entity extraction - proper nouns
  const entities = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  return [...new Set(entities)];
}

function extractLists(text: string): string[][] {
  const lists: string[][] = [];
  const lines = text.split('\n');
  let currentList: string[] = [];
  
  lines.forEach(line => {
    if (/^[\s]*[-*•]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line)) {
      currentList.push(line.trim());
    } else if (currentList.length > 0) {
      lists.push(currentList);
      currentList = [];
    }
  });
  
  if (currentList.length > 0) {
    lists.push(currentList);
  }
  
  return lists;
}

function extractActionableItems(sentences: string[]): string[] {
  const actionPatterns = [
    /\b(?:will|should|must|need(?:s)? to|have to|going to|plan to|intend to)\s+\w+/i,
    /\b(?:TODO|FIXME|ACTION|TASK|NEXT STEP):\s*.+/i,
    /\b(?:action items?|next steps?|deliverables?):\s*.+/i,
    /\b(?:responsible|assigned to|owner):\s*\w+/i
  ];
  
  return sentences.filter(sentence =>
    actionPatterns.some(pattern => pattern.test(sentence))
  );
}

function extractRelevantQuotes(text: string, summary: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const summaryLower = summary.toLowerCase();
  
  // Find sentences that relate to summary content
  const relevant = sentences.filter(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    const matchCount = words.filter(word => 
      word.length > 4 && summaryLower.includes(word)
    ).length;
    return matchCount > 3 && sentence.length > 30 && sentence.length < 150;
  });
  
  return relevant.slice(0, 3);
}

function generateStats(text: string): Record<string, any> {
  const words = text.split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
  const avgWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
  
  return {
    words,
    sentences,
    paragraphs,
    avgWordsPerSentence,
    characters: text.length,
    readingTime: Math.ceil(words / 200) // Average reading speed
  };
}

function appendQuotes(summary: string, quotes: string[], format: string): string {
  if (quotes.length === 0) return summary;
  
  const quotesSection = quotes.map(q => `> "${q}"`).join('\n\n');
  
  switch (format) {
    case 'markdown':
      return `${summary}\n\n### Relevant Quotes\n\n${quotesSection}`;
    case 'plain':
      return `${summary}\n\nRelevant Quotes:\n\n${quotes.map(q => `"${q}"`).join('\n\n')}`;
    default:
      return summary;
  }
}

function appendStats(summary: string, stats: Record<string, any>, format: string): string {
  switch (format) {
    case 'markdown':
      return `${summary}\n\n---\n\n**Document Statistics:**\n- Words: ${stats.words}\n- Sentences: ${stats.sentences}\n- Reading time: ~${stats.readingTime} minutes`;
    case 'json':
      return JSON.stringify({ summary, stats }, null, 2);
    default:
      return summary;
  }
}

function applyFocusFilter(summary: string, focus: string, analysis: ContentAnalysis): string {
  const focusLower = focus.toLowerCase();
  const lines = summary.split('\n');
  
  const filtered = lines.filter(line => 
    line.toLowerCase().includes(focusLower) ||
    line.length < 50 // Keep headers and short lines
  );
  
  if (filtered.length < lines.length / 2) {
    // Too much filtered out, be less strict
    return summary;
  }
  
  return filtered.join('\n');
}

function formatOutput(content: string, format: string, mode: string): { content: string; metadata?: any } {
  switch (format) {
    case 'json':
      return {
        content: JSON.stringify({
          mode,
          summary: content,
          timestamp: new Date().toISOString()
        }, null, 2),
        metadata: { format: 'json' }
      };
      
    case 'html':
      return {
        content: `<!DOCTYPE html>
<html>
<head>
    <title>Summary - ${mode}</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Summary</h1>
    <div class="summary-content">
        ${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
    </div>
    <footer>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </footer>
</body>
</html>`,
        metadata: { format: 'html' }
      };
      
    case 'outline':
      const lines = content.split('\n');
      const outlined = lines.map(line => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return line.replace(/\*\*/g, '');
        } else if (line.startsWith('• ')) {
          return '  ' + line;
        } else if (line.match(/^\d+\. /)) {
          return '  ' + line;
        } else {
          return '    ' + line;
        }
      });
      return {
        content: outlined.join('\n'),
        metadata: { format: 'outline' }
      };
      
    case 'plain':
      return {
        content: content.replace(/[*_#`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
        metadata: { format: 'plain' }
      };
      
    default:
      return {
        content,
        metadata: { format: 'markdown' }
      };
  }
}

function trimToWordLimit(text: string, limit: number): string {
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  
  return words.slice(0, limit).join(' ') + '...';
}

function generateImpliedQuestions(analysis: ContentAnalysis): string[] {
  const questions: string[] = [];
  
  // Generate questions based on content patterns
  if (analysis.numbers.length > 0) {
    questions.push('What do these metrics indicate about performance?');
  }
  
  if (analysis.dates.length > 0) {
    questions.push('What is the significance of this timeline?');
  }
  
  if (analysis.actionableItems.length > 0) {
    questions.push('Who is responsible for implementing these actions?');
  }
  
  const topKeywords = Array.from(analysis.keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topKeywords.length > 0) {
    questions.push(`How does ${topKeywords[0][0]} relate to the main objective?`);
  }
  
  return questions;
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
    'were', 'said', 'did', 'having', 'may', 'such'
  ]);
  
  return common.has(word.toLowerCase());
}

function isTechnicalTerm(word: string): boolean {
  const technical = [
    'api', 'algorithm', 'function', 'method', 'class', 'interface',
    'database', 'server', 'client', 'protocol', 'framework', 'library',
    'component', 'module', 'system', 'architecture', 'implementation',
    'performance', 'optimization', 'configuration', 'deployment',
    'integration', 'authentication', 'authorization', 'encryption',
    'cache', 'queue', 'thread', 'process', 'memory', 'cpu', 'network'
  ];
  
  return technical.includes(word.toLowerCase());
}

// Export the tool
export default tool;