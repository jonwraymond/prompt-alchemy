#!/usr/bin/env python3
"""
Simple test script for the Prompt Alchemy MCP server.
This script sends JSON-RPC requests to test the MCP protocol.
"""

import json
import subprocess
import sys
import time
import os

def send_mcp_request(process, request):
    """Send a JSON-RPC request to the MCP server."""
    request_json = json.dumps(request) + '\n'
    print(f"Sending: {request_json.strip()}")
    
    try:
        process.stdin.write(request_json)
        process.stdin.flush()
        
        # Read response line by line until we get a JSON response
        while True:
            line = process.stdout.readline()
            if not line:
                print("No response received")
                return None
                
            line = line.strip()
            if not line:
                continue
                
            # Skip log lines that start with 'time='
            if line.startswith('time='):
                continue
                
            try:
                response = json.loads(line)
                print(f"Received: {json.dumps(response, indent=2)}")
                return response
            except json.JSONDecodeError:
                # If it's not JSON, it might be a log line, continue reading
                print(f"Skipping non-JSON line: {line}")
                continue
                
    except Exception as e:
        print(f"Error sending request: {e}")
        return None

def test_mcp_server():
    """Test the MCP server with basic requests."""
    
    # Connect to the running Docker container
    cmd = [
        'docker', 'exec', '-i', 'prompt-alchemy-mcp',
        'prompt-alchemy', '--config', '/app/config.yaml', 'serve'
    ]
    
    print("Connecting to running MCP server...")
    print(f"Command: {' '.join(cmd)}")
    
    try:
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=0
        )
        
        # Wait a moment for the server to start
        time.sleep(2)
        
        # Test 1: Initialize
        print("\n=== Test 1: Initialize ===")
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {}
            }
        }
        response = send_mcp_request(process, init_request)
        
        if response and response.get('result'):
            print("✅ Initialize successful")
            server_info = response['result'].get('serverInfo', {})
            print(f"  Server: {server_info.get('name', 'Unknown')} v{server_info.get('version', 'Unknown')}")
        else:
            print("❌ Initialize failed")
            return
        
        # Test 2: List tools
        print("\n=== Test 2: List Tools ===")
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        response = send_mcp_request(process, tools_request)
        
        if response and response.get('result'):
            tools = response['result'].get('tools', [])
            print(f"✅ Found {len(tools)} tools")
            for tool in tools[:5]:  # Show first 5 tools
                print(f"  - {tool.get('name', 'Unknown')}: {tool.get('description', 'No description')[:80]}...")
        else:
            print("❌ List tools failed")
        
        # Test 3: Try a simple tool call (get_config if available)
        if response and response.get('result'):
            tools = response['result'].get('tools', [])
            if tools:
                first_tool = tools[0]
                tool_name = first_tool.get('name')
                
                print(f"\n=== Test 3: Call Tool '{tool_name}' ===")
                tool_request = {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": {}
                    }
                }
                response = send_mcp_request(process, tool_request)
                
                if response and response.get('result'):
                    print(f"✅ Tool call '{tool_name}' successful")
                    # Print first bit of content if available
                    content = response.get('result', {}).get('content', [])
                    if content and len(content) > 0:
                        text = content[0].get('text', '')[:200]
                        print(f"  Result preview: {text}...")
                else:
                    print(f"❌ Tool call '{tool_name}' failed")
        
        print("\n=== MCP Server Test Complete ===")
        
    except Exception as e:
        print(f"Error running test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            try:
                process.kill()
            except:
                pass

if __name__ == "__main__":
    test_mcp_server() 