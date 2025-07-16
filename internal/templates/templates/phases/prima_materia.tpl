Analyze the following user input and create a comprehensive, well-structured prompt that captures all essential requirements and intentions. Focus on extracting the core needs and organizing them into clear, actionable components.

Objectives:
- Identify the main task or goal from the user's input
- Extract key requirements, constraints, and specifications
- Determine the desired output format and structure
- Clarify any ambiguous elements while preserving intent
- Organize information into logical, actionable components

{{- if .Context}}

Additional Context:
{{range .Context}}• {{.}}
{{end}}
{{- end}}

User Input: {{.Input}}