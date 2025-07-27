/**
 * Summarize tool for Clanker
 * 
 * Provides intelligent text summarization with optional guidance
 */

import { createTool, ToolCategory, ToolCapability } from '@ziggler/clanker';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create the summarize tool
 */
export default createTool()
    .id('summarize')
    .name('Text Summarizer')
    .description('Intelligently summarize text content into a concise, structured markdown format with numbered lists, key points, and hierarchical organization')
    .category(ToolCategory.Utility)
    .capabilities(ToolCapability.FileRead)
    .tags('summarize', 'text', 'analysis', 'extract', 'condense')

    // Arguments
    .stringArg('text', 'The text content to summarize', {
        required: false,
        validate: (value) => {
            if (value !== undefined && typeof value !== 'string') return 'Text must be a string';
            if (value && value.trim().length < 10) return 'Text must be at least 10 characters long';
            if (value && value.trim().length > 100000) return 'Text must be less than 100,000 characters';
            return true;
        }
    })
    .stringArg('file', 'Path to file to summarize (alternative to text)', {
        required: false,
        validate: (value) => {
            if (value !== undefined && typeof value !== 'string') return 'File path must be a string';
            return true;
        }
    })
    .stringArg('instructions', 'Optional instructions for how to summarize', {
        required: false
    })

    // Examples
    .examples([
        {
            description: "Summarize meeting notes extracting action items",
            arguments: {
                text: "Meeting Notes - Product Launch Review\n\nAttendees: Sarah (PM), Mike (Dev), Lisa (Design)\n\nDiscussion:\n- Sarah presented the launch timeline, targeting March 15th\n- Mike mentioned the API integration is 80% complete, needs 2 more days\n- Lisa showed the new UI mockups, team loved the dark mode option\n- Budget concerns raised about marketing spend\n\nDecisions:\n- Approved dark mode for v1.0\n- Marketing budget capped at $50k\n- Beta testing starts March 1st\n\nNext Steps:\n- Mike to complete API by Friday\n- Lisa to finalize icons by next week\n- Sarah to recruit 20 beta testers",
                instructions: "Extract only the action items and deadlines in a bullet list"
            },
            result: "• Mike: Complete API integration by Friday\n• Lisa: Finalize icons by next week\n• Sarah: Recruit 20 beta testers\n• Team: Start beta testing March 1st\n• Team: Launch product March 15th"
        },
        {
            description: "Summarize a file with specific focus",
            arguments: {
                file: "docs/architecture.md",
                instructions: "Focus on the key design decisions and system components"
            },
            result: "**Key Design Decisions:**\n1. Microservices architecture for scalability\n2. Event-driven communication via Kafka\n3. PostgreSQL for transactional data, Redis for caching\n\n**System Components:**\n- API Gateway (Kong)\n- Authentication Service (OAuth2)\n- Core Business Services (User, Product, Order)\n- Data Pipeline (Apache Spark)\n- Monitoring Stack (Prometheus/Grafana)"
        }
    ])

    // Execute
    .execute(async (args, context) => {
        const { text, file, instructions } = args as {
            text?: string;
            file?: string;
            instructions?: string;
        };

        // Validate that either text or file is provided
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

        let contentToSummarize = text || '';

        // Read file if file path is provided
        if (file) {
            try {
                const resolvedPath = path.resolve(context.workingDirectory, file);
                if (!fs.existsSync(resolvedPath)) {
                    return {
                        success: false,
                        error: `File not found: ${file}`
                    };
                }
                contentToSummarize = fs.readFileSync(resolvedPath, 'utf-8');
                context.logger?.debug(`Read file: ${resolvedPath} (${contentToSummarize.length} characters)`);
            } catch (error) {
                return {
                    success: false,
                    error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
                };
            }
        }

        context.logger?.debug(`Summarizing text of length: ${contentToSummarize.length}`);
        if (instructions) {
            context.logger?.debug(`Using custom instructions: ${instructions}`);
        }

        // For this standalone tool, we'll use the basic summarization
        // In a real implementation, you could add API integration here
        return performBasicSummarization(contentToSummarize, instructions, context);
    })
    .build();

/**
 * Basic summarization without AI
 */
function performBasicSummarization(text: string, instructions: string | undefined, context: any) {
    const lines = text.split('\n').filter(line => line.trim());
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    // Extract different types of content
    const extractKeyPoints = () => {
        return sentences
            .filter((s: string) => s.trim().length > 30)
            .slice(0, 5)
            .map((s: string) => s.trim());
    };

    const extractActionItems = () => {
        const actionPatterns = [
            /(?:will|should|must|need(?:s)? to|have to|going to)\s+\w+/gi,
            /\b(?:TODO|FIXME|ACTION|TASK):\s*.+/gi,
            /\b(?:next steps?|action items?):\s*.+/gi
        ];
        return sentences.filter((s: string) =>
            actionPatterns.some(pattern => pattern.test(s))
        ).map((s: string) => s.trim());
    };

    const extractSections = () => {
        const sections: Record<string, string[]> = {};
        let currentSection = 'Overview';

        lines.forEach(line => {
            // Check if line is a header
            if (line.match(/^#+\s+/) || line.match(/^[A-Z][^.!?]*:$/)) {
                currentSection = line.replace(/^#+\s+/, '').replace(/:$/, '').trim();
                sections[currentSection] = [];
            } else if (line.trim()) {
                if (!sections[currentSection]) sections[currentSection] = [];
                sections[currentSection].push(line.trim());
            }
        });

        return sections;
    };

    let summaryData: any;

    // Build structured summary based on instructions
    if (instructions?.toLowerCase().includes('action')) {
        const actions = extractActionItems();
        summaryData = {
            type: 'action_items',
            title: 'Action Items Extracted',
            items: actions.slice(0, 10),
            count: actions.length
        };
    } else if (instructions?.toLowerCase().includes('section')) {
        const sections = extractSections();
        summaryData = {
            type: 'sections',
            title: 'Document Structure',
            sections: Object.entries(sections).slice(0, 5).map(([title, content]) => ({
                title,
                summary: content.slice(0, 2).join(' ')
            }))
        };
    } else if (instructions?.toLowerCase().includes('brief') || instructions?.toLowerCase().includes('short')) {
        summaryData = {
            type: 'brief',
            title: 'Brief Summary',
            content: sentences.slice(0, 2).join(' ').trim()
        };
    } else {
        // Default structured summary
        const keyPoints = extractKeyPoints();
        const hasActions = extractActionItems().length > 0;

        summaryData = {
            type: 'structured',
            title: 'Summary',
            overview: paragraphs[0]?.substring(0, 200) + (paragraphs[0]?.length > 200 ? '...' : ''),
            keyPoints: keyPoints.slice(0, 3),
            sections: Object.keys(extractSections()).slice(0, 3),
            hasActionItems: hasActions
        };
    }

    // Convert to markdown format
    let summary = '';

    switch (summaryData.type) {
        case 'action_items':
            summary = summaryData.items.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n');
            break;

        case 'sections':
            summary = summaryData.sections.map((s: any, i: number) =>
                `${i + 1}. **${s.title}**: ${s.summary}`
            ).join('\n');
            break;

        case 'brief':
            summary = summaryData.content;
            break;

        case 'structured':
            const parts = [];
            if (summaryData.overview) {
                parts.push(`**Overview**: ${summaryData.overview}`);
            }
            if (summaryData.keyPoints?.length > 0) {
                parts.push('\n**Key Points**:');
                summaryData.keyPoints.forEach((point: string, i: number) => {
                    parts.push(`${i + 1}. ${point}`);
                });
            }
            if (summaryData.sections?.length > 0) {
                parts.push('\n**Sections Found**:');
                summaryData.sections.forEach((section: string) => {
                    parts.push(`- ${section}`);
                });
            }
            summary = parts.join('\n');
            break;
    }

    // Calculate compression ratio
    const originalWords = text.split(/\s+/).length;
    const summaryWords = summary.split(/\s+/).length;
    const compressionRatio = Math.round((1 - summaryWords / originalWords) * 100);

    context.logger?.info(`Summary generated (${compressionRatio}% compression)`);

    return {
        success: true,
        output: summary,
        data: {
            originalLength: text.length,
            summaryLength: summary.length,
            originalWords,
            summaryWords,
            compressionRatio,
            instructions,
            summaryType: summaryData.type,
            source: file ? `file: ${file}` : 'text input',
            note: 'Basic text processing (AI integration available in full Clanker)'
        }
    };
}