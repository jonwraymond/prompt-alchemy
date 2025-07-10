package cmd

import (
	"bufio"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/jonwraymond/prompt-alchemy/internal/engine"
	log "github.com/jonwraymond/prompt-alchemy/internal/log"
	"github.com/jonwraymond/prompt-alchemy/internal/providers"
	"github.com/jonwraymond/prompt-alchemy/internal/storage"
	"github.com/jonwraymond/prompt-alchemy/pkg/models"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	batchFile        string
	batchInputFormat string
	batchOutput      string
	batchWorkers     int
	batchTimeout     int
	batchDryRun      bool
	batchProgress    bool
	batchResume      string
	batchSkipErrors  bool
)

// BatchInput represents a single batch generation request
type BatchInput struct {
	ID          string            `json:"id" csv:"id"`
	Input       string            `json:"input" csv:"input"`
	Phases      string            `json:"phases,omitempty" csv:"phases"`
	Count       int               `json:"count,omitempty" csv:"count"`
	Temperature float64           `json:"temperature,omitempty" csv:"temperature"`
	MaxTokens   int               `json:"max_tokens,omitempty" csv:"max_tokens"`
	Tags        string            `json:"tags,omitempty" csv:"tags"`
	Provider    string            `json:"provider,omitempty" csv:"provider"`
	Persona     string            `json:"persona,omitempty" csv:"persona"`
	Metadata    map[string]string `json:"metadata,omitempty" csv:"-"`
}

// BatchResult represents the result of a batch generation
type BatchResult struct {
	ID        string          `json:"id"`
	Input     BatchInput      `json:"input"`
	Success   bool            `json:"success"`
	Error     string          `json:"error,omitempty"`
	Prompts   []models.Prompt `json:"prompts,omitempty"`
	Duration  time.Duration   `json:"duration"`
	Timestamp time.Time       `json:"timestamp"`
}

// BatchSummary provides overall batch operation statistics
type BatchSummary struct {
	TotalInputs     int           `json:"total_inputs"`
	SuccessfulJobs  int           `json:"successful_jobs"`
	FailedJobs      int           `json:"failed_jobs"`
	TotalPrompts    int           `json:"total_prompts"`
	TotalDuration   time.Duration `json:"total_duration"`
	AverageDuration time.Duration `json:"average_duration"`
	StartTime       time.Time     `json:"start_time"`
	EndTime         time.Time     `json:"end_time"`
}

// batchCmd represents the batch command
var batchCmd = &cobra.Command{
	Use:   "batch",
	Short: "Generate multiple prompts in batch mode",
	Long: `Generate multiple prompts efficiently using batch processing with concurrent workers.

Supports multiple input formats:
- JSON: Structured batch requests with full parameter control
- CSV: Tabular format for easy spreadsheet integration  
- Text: Simple line-by-line input processing
- Interactive: Command-line input for multiple prompts

Features:
- Concurrent processing with configurable worker count
- Progress tracking and resumable operations
- Error handling with skip-on-error option
- Multiple output formats (JSON, CSV, text)
- Dry-run mode for validation

Examples:
  # Process JSON batch file
  prompt-alchemy batch --file requests.json --format json

  # Process CSV with custom settings
  prompt-alchemy batch --file inputs.csv --format csv --workers 5

  # Interactive batch mode
  prompt-alchemy batch --interactive

  # Dry run validation
  prompt-alchemy batch --file requests.json --dry-run

  # Resume failed batch
  prompt-alchemy batch --resume batch_20240109_143022.json`,
	RunE: runBatch,
}

func init() {
	batchCmd.Flags().StringVarP(&batchFile, "file", "f", "", "Input file path (JSON, CSV, or text)")
	batchCmd.Flags().StringVar(&batchInputFormat, "format", "auto", "Input format (json, csv, text, auto)")
	batchCmd.Flags().StringVarP(&batchOutput, "output", "o", "", "Output file path (default: batch_TIMESTAMP.json)")
	batchCmd.Flags().IntVarP(&batchWorkers, "workers", "w", 3, "Number of concurrent workers")
	batchCmd.Flags().IntVar(&batchTimeout, "timeout", 300, "Timeout per job in seconds")
	batchCmd.Flags().BoolVar(&batchDryRun, "dry-run", false, "Validate inputs without generating prompts")
	batchCmd.Flags().BoolVar(&batchProgress, "progress", true, "Show progress bar")
	batchCmd.Flags().StringVar(&batchResume, "resume", "", "Resume from previous batch results file")
	batchCmd.Flags().BoolVar(&batchSkipErrors, "skip-errors", false, "Continue processing on individual job errors")
	batchCmd.Flags().BoolP("interactive", "i", false, "Interactive batch input mode")
}

func runBatch(cmd *cobra.Command, args []string) error {
	logger := log.GetLogger()
	logger.Info("Starting batch prompt generation")

	// Handle interactive mode
	interactive, _ := cmd.Flags().GetBool("interactive")
	if interactive {
		return runInteractiveBatch()
	}

	// Handle resume mode
	if batchResume != "" {
		return resumeBatch(batchResume)
	}

	// Validate input file
	if batchFile == "" {
		return fmt.Errorf("input file is required (use --file or --interactive)")
	}

	if _, err := os.Stat(batchFile); os.IsNotExist(err) {
		return fmt.Errorf("input file does not exist: %s", batchFile)
	}

	// Determine input format
	format := batchInputFormat
	if format == "auto" {
		format = detectInputFormat(batchFile)
		logger.Infof("Auto-detected input format: %s", format)
	}

	// Parse input file
	inputs, err := parseBatchInputs(batchFile, format)
	if err != nil {
		return fmt.Errorf("failed to parse input file: %w", err)
	}

	logger.Infof("Loaded %d batch inputs", len(inputs))

	// Validate inputs
	if err := validateBatchInputs(inputs); err != nil {
		return fmt.Errorf("input validation failed: %w", err)
	}

	// Dry run mode
	if batchDryRun {
		return runDryRun(inputs)
	}

	// Process batch
	return processBatch(inputs)
}

func detectInputFormat(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".json":
		return "json"
	case ".csv":
		return "csv"
	case ".txt", ".text":
		return "text"
	default:
		return "text" // Default fallback
	}
}

func parseBatchInputs(filename, format string) ([]BatchInput, error) {
	logger := log.GetLogger()
	logger.Debugf("Parsing batch inputs from %s (format: %s)", filename, format)

	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer func() {
		if err := file.Close(); err != nil {
			logger.Warn("Failed to close file", "error", err)
		}
	}()

	switch format {
	case "json":
		return parseJSONInputs(file)
	case "csv":
		return parseCSVInputs(file)
	case "text":
		return parseTextInputs(file)
	default:
		return nil, fmt.Errorf("unsupported input format: %s", format)
	}
}

func parseJSONInputs(file *os.File) ([]BatchInput, error) {
	var inputs []BatchInput
	decoder := json.NewDecoder(file)

	if err := decoder.Decode(&inputs); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return inputs, nil
}

func parseCSVInputs(file *os.File) ([]BatchInput, error) {
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) == 0 {
		return nil, fmt.Errorf("CSV file is empty")
	}

	// Parse header
	header := records[0]
	var inputs []BatchInput

	for i, record := range records[1:] {
		input := BatchInput{
			ID: fmt.Sprintf("csv_%d", i+1),
		}

		for j, value := range record {
			if j >= len(header) {
				break
			}

			switch strings.ToLower(header[j]) {
			case "id":
				if value != "" {
					input.ID = value
				}
			case "input":
				input.Input = value
			case "phases":
				input.Phases = value
			case "count":
				if value != "" {
					if _, err := fmt.Sscanf(value, "%d", &input.Count); err != nil {
						logger.Warn("Failed to parse count", "value", value, "error", err)
					}
				}
			case "temperature":
				if value != "" {
					if _, err := fmt.Sscanf(value, "%f", &input.Temperature); err != nil {
						logger.Warn("Failed to parse temperature", "value", value, "error", err)
					}
				}
			case "max_tokens":
				if value != "" {
					if _, err := fmt.Sscanf(value, "%d", &input.MaxTokens); err != nil {
						logger.Warn("Failed to parse max_tokens", "value", value, "error", err)
					}
				}
			case "tags":
				input.Tags = value
			case "provider":
				input.Provider = value
			case "persona":
				input.Persona = value
			}
		}

		inputs = append(inputs, input)
	}

	return inputs, nil
}

func parseTextInputs(file *os.File) ([]BatchInput, error) {
	var inputs []BatchInput
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue // Skip empty lines and comments
		}

		lineNum++
		inputs = append(inputs, BatchInput{
			ID:    fmt.Sprintf("text_%d", lineNum),
			Input: line,
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to read text file: %w", err)
	}

	return inputs, nil
}

func validateBatchInputs(inputs []BatchInput) error {
	logger := log.GetLogger()
	logger.Debug("Validating batch inputs")

	if len(inputs) == 0 {
		return fmt.Errorf("no valid inputs found")
	}

	idMap := make(map[string]bool)
	for i, input := range inputs {
		// Check for required fields
		if input.Input == "" {
			return fmt.Errorf("input %d: missing required field 'input'", i+1)
		}

		// Check for duplicate IDs
		if idMap[input.ID] {
			return fmt.Errorf("input %d: duplicate ID '%s'", i+1, input.ID)
		}
		idMap[input.ID] = true

		// Validate parameter ranges
		if input.Temperature < 0 || input.Temperature > 2 {
			return fmt.Errorf("input %d (%s): temperature must be between 0 and 2", i+1, input.ID)
		}

		if input.Count < 0 || input.Count > 20 {
			return fmt.Errorf("input %d (%s): count must be between 1 and 20", i+1, input.ID)
		}

		if input.MaxTokens < 0 || input.MaxTokens > 10000 {
			return fmt.Errorf("input %d (%s): max_tokens must be between 1 and 10000", i+1, input.ID)
		}
	}

	logger.Infof("Validated %d batch inputs successfully", len(inputs))
	return nil
}

func runDryRun(inputs []BatchInput) error {
	logger := log.GetLogger()
	logger.Info("Running dry-run validation")

	// Initialize providers for validation
	_ = providers.NewRegistry()

	validProviders := make(map[string]bool)
	for name := range viper.GetStringMap("providers") {
		validProviders[name] = true
	}

	var issues []string

	for i, input := range inputs {
		// Check provider availability
		if input.Provider != "" && !validProviders[input.Provider] {
			issues = append(issues, fmt.Sprintf("Input %d (%s): unknown provider '%s'", i+1, input.ID, input.Provider))
		}

		// Check phase validity
		if input.Phases != "" {
			phases := strings.Split(input.Phases, ",")
			for _, phaseStr := range phases {
				phaseStr = strings.TrimSpace(phaseStr)
				if phaseStr != "idea" && phaseStr != "human" && phaseStr != "precision" {
					issues = append(issues, fmt.Sprintf("Input %d (%s): unknown phase '%s'", i+1, input.ID, phaseStr))
				}
			}
		}

		// Apply defaults and validate final parameters
		finalInput := applyBatchDefaults(input)
		if finalInput.Count == 0 {
			finalInput.Count = 3
		}
		if finalInput.Temperature == 0 {
			finalInput.Temperature = 0.7
		}
		if finalInput.MaxTokens == 0 {
			finalInput.MaxTokens = 2000
		}

		logger.Infof("✓ Input %d (%s): %s", i+1, input.ID, batchTruncateString(input.Input, 50))
	}

	if len(issues) > 0 {
		logger.Error("Validation issues found:")
		for _, issue := range issues {
			logger.Errorf("  • %s", issue)
		}
		return fmt.Errorf("dry-run validation failed with %d issues", len(issues))
	}

	logger.Infof("✅ Dry-run validation successful for %d inputs", len(inputs))
	logger.Info("Use --dry-run=false to proceed with actual generation")

	return nil
}

func processBatch(inputs []BatchInput) error {
	logger := log.GetLogger()
	startTime := time.Now()

	// Initialize storage
	store, err := storage.NewStorage(viper.GetString("data_dir"), logger)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	defer func() {
		if err := store.Close(); err != nil {
			logger.WithError(err).Warn("Failed to close storage")
		}
	}()

	// Initialize providers
	registry := providers.NewRegistry()

	// Initialize engine
	promptEngine := engine.NewEngine(registry, logger)

	// Setup output file
	outputFile := batchOutput
	if outputFile == "" {
		outputFile = fmt.Sprintf("batch_%s.json", time.Now().Format("20060102_150405"))
	}

	logger.Infof("Processing %d inputs with %d workers", len(inputs), batchWorkers)
	logger.Infof("Results will be saved to: %s", outputFile)

	// Create worker pool
	inputChan := make(chan BatchInput, len(inputs))
	resultChan := make(chan BatchResult, len(inputs))

	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < batchWorkers; i++ {
		wg.Add(1)
		go batchWorker(i+1, inputChan, resultChan, promptEngine, &wg)
	}

	// Send inputs to workers
	go func() {
		for _, input := range inputs {
			inputChan <- input
		}
		close(inputChan)
	}()

	// Collect results
	var results []BatchResult
	var completed int
	total := len(inputs)

	go func() {
		wg.Wait()
		close(resultChan)
	}()

	for result := range resultChan {
		results = append(results, result)
		completed++

		if batchProgress {
			percentage := (completed * 100) / total
			logger.Infof("Progress: %d/%d (%d%%) - %s", completed, total, percentage, result.ID)
		}

		// Save intermediate results
		if completed%10 == 0 || completed == total {
			if err := saveBatchResults(outputFile, results, startTime); err != nil {
				logger.WithError(err).Warn("Failed to save intermediate results")
			}
		}
	}

	// Final save
	err = saveBatchResults(outputFile, results, startTime)
	if err != nil {
		return fmt.Errorf("failed to save final results: %w", err)
	}

	// Generate summary
	summary := generateBatchSummary(results, startTime)
	displayBatchSummary(summary)

	logger.Infof("Batch processing completed successfully")
	logger.Infof("Results saved to: %s", outputFile)

	return nil
}

func batchWorker(workerID int, inputChan <-chan BatchInput, resultChan chan<- BatchResult, promptEngine *engine.Engine, wg *sync.WaitGroup) {
	defer wg.Done()
	logger := log.GetLogger()

	for input := range inputChan {
		result := processBatchInput(workerID, input, promptEngine)
		resultChan <- result

		if !result.Success && !batchSkipErrors {
			logger.Errorf("Worker %d: Job %s failed: %s", workerID, input.ID, result.Error)
		}
	}
}

func processBatchInput(workerID int, input BatchInput, promptEngine *engine.Engine) BatchResult {
	logger := log.GetLogger()
	startTime := time.Now()

	result := BatchResult{
		ID:        input.ID,
		Input:     input,
		Timestamp: startTime,
	}

	// Apply defaults
	finalInput := applyBatchDefaults(input)

	// Parse phases
	phaseList := []models.Phase{models.PhaseIdea, models.PhaseHuman, models.PhasePrecision}
	if finalInput.Phases != "" {
		phaseList = batchParsePhases(finalInput.Phases)
	}

	// Create generation request
	request := models.PromptRequest{
		Input:       finalInput.Input,
		Phases:      phaseList,
		Count:       finalInput.Count,
		Temperature: finalInput.Temperature,
		MaxTokens:   finalInput.MaxTokens,
	}

	// Add tags
	if finalInput.Tags != "" {
		request.Tags = strings.Split(finalInput.Tags, ",")
		for i, tag := range request.Tags {
			request.Tags[i] = strings.TrimSpace(tag)
		}
	}

	// Generate prompts
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(batchTimeout)*time.Second)
	defer cancel()

	// Create phase configs (use defaults for now)
	phaseConfigs := []providers.PhaseConfig{}

	generationResult, err := promptEngine.Generate(ctx, engine.GenerateOptions{
		Request:        request,
		PhaseConfigs:   phaseConfigs,
		UseParallel:    true,
		IncludeContext: false,
		Persona:        finalInput.Persona,
		TargetModel:    "",
	})

	if err != nil {
		result.Error = err.Error()
		result.Duration = time.Since(startTime)
		return result
	}

	result.Success = true
	result.Prompts = generationResult.Prompts
	result.Duration = time.Since(startTime)

	logger.Debugf("Worker %d: Generated %d prompts for %s in %v", workerID, len(generationResult.Prompts), input.ID, result.Duration)
	return result
}

func applyBatchDefaults(input BatchInput) BatchInput {
	// Apply defaults from configuration or command-line flags
	if input.Count == 0 {
		input.Count = viper.GetInt("generation.default_count")
		if input.Count == 0 {
			input.Count = 3
		}
	}

	if input.Temperature == 0 {
		input.Temperature = viper.GetFloat64("generation.default_temperature")
		if input.Temperature == 0 {
			input.Temperature = 0.7
		}
	}

	if input.MaxTokens == 0 {
		input.MaxTokens = viper.GetInt("generation.default_max_tokens")
		if input.MaxTokens == 0 {
			input.MaxTokens = 2000
		}
	}

	if input.Provider == "" {
		input.Provider = viper.GetString("generation.default_provider")
	}

	return input
}

func batchParsePhases(phasesStr string) []models.Phase {
	parts := strings.Split(phasesStr, ",")
	var phases []models.Phase

	for _, part := range parts {
		switch strings.TrimSpace(strings.ToLower(part)) {
		case "idea":
			phases = append(phases, models.PhaseIdea)
		case "human":
			phases = append(phases, models.PhaseHuman)
		case "precision":
			phases = append(phases, models.PhasePrecision)
		}
	}

	if len(phases) == 0 {
		// Default to all phases
		phases = []models.Phase{models.PhaseIdea, models.PhaseHuman, models.PhasePrecision}
	}

	return phases
}

func saveBatchResults(filename string, results []BatchResult, startTime time.Time) error {
	summary := generateBatchSummary(results, startTime)

	output := struct {
		Summary BatchSummary  `json:"summary"`
		Results []BatchResult `json:"results"`
	}{
		Summary: summary,
		Results: results,
	}

	data, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filename, data, 0600)
}

func generateBatchSummary(results []BatchResult, startTime time.Time) BatchSummary {
	summary := BatchSummary{
		TotalInputs: len(results),
		StartTime:   startTime,
		EndTime:     time.Now(),
	}

	var totalDuration time.Duration
	for _, result := range results {
		if result.Success {
			summary.SuccessfulJobs++
			summary.TotalPrompts += len(result.Prompts)
		} else {
			summary.FailedJobs++
		}
		totalDuration += result.Duration
	}

	summary.TotalDuration = summary.EndTime.Sub(startTime)
	if summary.TotalInputs > 0 {
		summary.AverageDuration = totalDuration / time.Duration(summary.TotalInputs)
	}

	return summary
}

func displayBatchSummary(summary BatchSummary) {
	logger := log.GetLogger()

	logger.Info("📊 Batch Processing Summary")
	logger.Info("===========================")
	logger.Infof("Total Inputs: %d", summary.TotalInputs)
	logger.Infof("Successful Jobs: %d", summary.SuccessfulJobs)
	logger.Infof("Failed Jobs: %d", summary.FailedJobs)
	logger.Infof("Total Prompts Generated: %d", summary.TotalPrompts)
	logger.Infof("Total Duration: %v", summary.TotalDuration)
	logger.Infof("Average Duration per Job: %v", summary.AverageDuration)

	if summary.FailedJobs > 0 {
		successRate := float64(summary.SuccessfulJobs) / float64(summary.TotalInputs) * 100
		logger.Infof("Success Rate: %.1f%%", successRate)
	} else {
		logger.Info("Success Rate: 100% ✅")
	}
}

func runInteractiveBatch() error {
	logger := log.GetLogger()
	logger.Info("Starting interactive batch mode")
	logger.Info("Enter prompts one per line. Type 'END' to finish, 'HELP' for commands.")

	var inputs []BatchInput
	scanner := bufio.NewScanner(os.Stdin)
	inputNum := 1

	for {
		fmt.Printf("Prompt %d: ", inputNum)
		if !scanner.Scan() {
			break
		}

		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		if strings.ToUpper(line) == "END" {
			break
		}

		if strings.ToUpper(line) == "HELP" {
			fmt.Println("Commands:")
			fmt.Println("  END    - Finish input and start processing")
			fmt.Println("  HELP   - Show this help")
			fmt.Println("  QUIT   - Exit without processing")
			continue
		}

		if strings.ToUpper(line) == "QUIT" {
			fmt.Println("Exiting without processing.")
			return nil
		}

		inputs = append(inputs, BatchInput{
			ID:    fmt.Sprintf("interactive_%d", inputNum),
			Input: line,
		})
		inputNum++
	}

	if len(inputs) == 0 {
		logger.Info("No inputs provided. Exiting.")
		return nil
	}

	logger.Infof("Processing %d interactive inputs", len(inputs))
	return processBatch(inputs)
}

func resumeBatch(resumeFile string) error {
	logger := log.GetLogger()
	logger.Infof("Resuming batch from: %s", resumeFile)

	// Load previous results
	data, err := os.ReadFile(resumeFile)
	if err != nil {
		return fmt.Errorf("failed to read resume file: %w", err)
	}

	var resumeData struct {
		Summary BatchSummary  `json:"summary"`
		Results []BatchResult `json:"results"`
	}

	if err := json.Unmarshal(data, &resumeData); err != nil {
		return fmt.Errorf("failed to parse resume file: %w", err)
	}

	// Find failed jobs
	var failedInputs []BatchInput
	for _, result := range resumeData.Results {
		if !result.Success {
			failedInputs = append(failedInputs, result.Input)
		}
	}

	if len(failedInputs) == 0 {
		logger.Info("No failed jobs found in resume file. All jobs completed successfully.")
		return nil
	}

	logger.Infof("Found %d failed jobs to retry", len(failedInputs))

	// Process failed jobs
	return processBatch(failedInputs)
}

func batchTruncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
