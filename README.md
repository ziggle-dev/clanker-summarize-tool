# Clanker Summarize Tool

Intelligently summarize text content into concise, structured markdown format with numbered lists, key points, and hierarchical organization.

## Features

- AI-powered summarization using configured LLM
- Fallback to basic text processing when no API key is available
- Support for both text input and file reading
- Customizable summarization with instructions
- Structured output with key points and overview
- Compression ratio statistics

## Installation

```bash
clanker install ziggle-dev/summarize
```

## Usage

### Summarize text directly
```bash
clanker summarize --text "Your long text content here..."
```

### Summarize a file
```bash
clanker summarize --file README.md
```

### Custom instructions
```bash
clanker summarize --file meeting-notes.txt --instructions "Extract only action items"
```

## Arguments

- `text` (optional): The text content to summarize
- `file` (optional): Path to file to summarize (alternative to text)
- `instructions` (optional): Custom instructions for how to summarize

Note: You must provide either `text` or `file`, but not both.

## Examples

### Extract action items from meeting notes
```bash
clanker summarize --file meeting.txt --instructions "Extract only the action items and deadlines"
```

### Create technical summary
```bash
clanker summarize --file docs/architecture.md --instructions "Focus on key design decisions"
```

### Quick executive summary
```bash
clanker summarize --text "Q4 report content..." --instructions "100-word executive summary"
```

## Output Format

The tool produces structured markdown output with:
- Numbered points for key items
- Bold text for emphasis
- Clear hierarchical organization
- Compression statistics

## Requirements

- Clanker CLI v0.2.6 or higher
- API key configured for AI-powered summaries (optional)