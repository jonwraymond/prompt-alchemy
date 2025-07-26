// Package registry provides service registration and discovery for hybrid deployment
package registry

import (
	"fmt"
	"sync"
	"time"

	"github.com/jonwraymond/prompt-alchemy/pkg/interfaces"
)

// serviceRegistry implements the ServiceRegistry interface
type serviceRegistry struct {
	services  map[string]interface{}
	health    map[string]interfaces.HealthStatus
	mutex     sync.RWMutex
	discovery interfaces.ServiceDiscovery
}

// NewServiceRegistry creates a new service registry instance
func NewServiceRegistry() interfaces.ServiceRegistry {
	return &serviceRegistry{
		services: make(map[string]interface{}),
		health:   make(map[string]interfaces.HealthStatus),
	}
}

// RegisterService registers a service instance with the registry
func (r *serviceRegistry) RegisterService(name string, service interface{}) error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.services[name] = service

	// Initialize health status
	r.health[name] = interfaces.HealthStatus{
		Status:    "operational",
		LastCheck: time.Now(),
		Details:   make(map[string]string),
	}

	// Register with service discovery if available
	if r.discovery != nil {
		metadata := map[string]string{
			"type":       fmt.Sprintf("%T", service),
			"registered": time.Now().Format(time.RFC3339),
		}

		// Try to get service address if it has one
		address := "local"
		if addressProvider, ok := service.(interface{ GetAddress() string }); ok {
			address = addressProvider.GetAddress()
		}

		return r.discovery.Register(name, address, metadata)
	}

	return nil
}

// GetService retrieves a service instance from the registry
func (r *serviceRegistry) GetService(name string) (interface{}, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	if service, exists := r.services[name]; exists {
		return service, nil
	}

	// Try service discovery if available
	if r.discovery != nil {
		instances, err := r.discovery.Discover(name)
		if err != nil {
			return nil, fmt.Errorf("service %s not found locally or in discovery: %w", name, err)
		}

		if len(instances) == 0 {
			return nil, fmt.Errorf("service %s not found", name)
		}

		// For now, return the first instance
		// TODO: Implement load balancing logic
		return instances[0], nil
	}

	return nil, fmt.Errorf("service %s not found", name)
}

// ListServices returns all registered services
func (r *serviceRegistry) ListServices() map[string]interface{} {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	// Create a copy to avoid concurrent access issues
	services := make(map[string]interface{})
	for name, service := range r.services {
		services[name] = service
	}

	return services
}

// Health returns health status for all registered services
func (r *serviceRegistry) Health() map[string]interfaces.HealthStatus {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Update health status for all services
	for name, service := range r.services {
		startTime := time.Now()

		// Check if service implements health checking
		if healthChecker, ok := service.(interface {
			Health() interfaces.HealthStatus
		}); ok {
			health := healthChecker.Health()
			health.LastCheck = time.Now()
			health.ResponseTime = time.Since(startTime)
			r.health[name] = health
		} else {
			// Default to operational if no health check available
			r.health[name] = interfaces.HealthStatus{
				Status:       "operational",
				LastCheck:    time.Now(),
				ResponseTime: time.Since(startTime),
				Details: map[string]string{
					"note": "No health check implemented",
				},
			}
		}
	}

	// Create a copy to avoid concurrent access issues
	health := make(map[string]interfaces.HealthStatus)
	for name, status := range r.health {
		health[name] = status
	}

	return health
}

// SetDiscovery sets the service discovery backend
func (r *serviceRegistry) SetDiscovery(discovery interfaces.ServiceDiscovery) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	r.discovery = discovery
}

// GetHealthyService returns a healthy instance of the requested service
func (r *serviceRegistry) GetHealthyService(name string) (interface{}, error) {
	service, err := r.GetService(name)
	if err != nil {
		return nil, err
	}

	// Check health if possible
	if healthChecker, ok := service.(interface {
		Health() interfaces.HealthStatus
	}); ok {
		health := healthChecker.Health()
		if health.Status == "down" {
			return nil, fmt.Errorf("service %s is down: %s", name, health.Error)
		}
	}

	return service, nil
}

// WaitForService waits for a service to become available
func (r *serviceRegistry) WaitForService(name string, timeout time.Duration) (interface{}, error) {
	deadline := time.Now().Add(timeout)

	for time.Now().Before(deadline) {
		service, err := r.GetHealthyService(name)
		if err == nil {
			return service, nil
		}

		time.Sleep(100 * time.Millisecond)
	}

	return nil, fmt.Errorf("service %s not available within timeout", name)
}

// Shutdown gracefully shuts down all registered services
func (r *serviceRegistry) Shutdown() error {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	var errors []error

	// Shutdown services that support it
	for name, service := range r.services {
		if shutdowner, ok := service.(interface{ Stop() error }); ok {
			if err := shutdowner.Stop(); err != nil {
				errors = append(errors, fmt.Errorf("failed to shutdown %s: %w", name, err))
			}
		}
	}

	// Unregister from service discovery
	if r.discovery != nil {
		for name := range r.services {
			if err := r.discovery.Unregister(name); err != nil {
				errors = append(errors, fmt.Errorf("failed to unregister %s: %w", name, err))
			}
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("shutdown errors: %v", errors)
	}

	return nil
}

// localDiscovery implements ServiceDiscovery for single-binary deployments
type localDiscovery struct {
	instances map[string][]interfaces.ServiceInstance
	mutex     sync.RWMutex
}

// NewLocalDiscovery creates a local service discovery implementation
func NewLocalDiscovery() interfaces.ServiceDiscovery {
	return &localDiscovery{
		instances: make(map[string][]interfaces.ServiceInstance),
	}
}

func (d *localDiscovery) Register(name string, address string, metadata map[string]string) error {
	d.mutex.Lock()
	defer d.mutex.Unlock()

	instance := interfaces.ServiceInstance{
		ID:       fmt.Sprintf("%s-%d", name, time.Now().Unix()),
		Name:     name,
		Address:  address,
		Metadata: metadata,
		Health: interfaces.HealthStatus{
			Status:    "operational",
			LastCheck: time.Now(),
		},
	}

	d.instances[name] = append(d.instances[name], instance)
	return nil
}

func (d *localDiscovery) Discover(name string) ([]interfaces.ServiceInstance, error) {
	d.mutex.RLock()
	defer d.mutex.RUnlock()

	instances, exists := d.instances[name]
	if !exists {
		return nil, fmt.Errorf("service %s not found", name)
	}

	return instances, nil
}

func (d *localDiscovery) Watch(name string, callback func(instances []interfaces.ServiceInstance)) error {
	// For local discovery, we can just call the callback once with current instances
	instances, err := d.Discover(name)
	if err != nil {
		return err
	}

	callback(instances)
	return nil
}

func (d *localDiscovery) Unregister(name string) error {
	d.mutex.Lock()
	defer d.mutex.Unlock()

	delete(d.instances, name)
	return nil
}

func (d *localDiscovery) Health() interfaces.HealthStatus {
	d.mutex.RLock()
	defer d.mutex.RUnlock()

	return interfaces.HealthStatus{
		Status:    "operational",
		LastCheck: time.Now(),
		Details: map[string]string{
			"type":      "local",
			"instances": fmt.Sprintf("%d", len(d.instances)),
		},
	}
}
