Take the following prompt and create the most effective, polished version possible. Focus on eliminating redundancy, improving clarity, and optimizing the overall structure while preserving all essential information and functionality.

Prompt to Optimize:
{{.Prompt}}

Optimization Goals:
- Remove redundant or unnecessary elements
- Enhance clarity and precision
- Improve overall structure and organization
- Maximize effectiveness and impact
- Create the optimal balance between conciseness and completeness
- Ensure the final prompt is production-ready

{{- if .TargetModel}}

Target Model: {{.TargetModel}}
{{- end}}

{{- if .Persona}}

Persona: {{.Persona}}
{{- end}}

{{- if .OptimizationHints}}

Optimization Hints:
{{range .OptimizationHints}}• {{.}}
{{end}}
{{- end}}