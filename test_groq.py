#!/usr/bin/env python3
"""
Simple Groq API test script to verify your API key works with meta-llama/llama-4-scout-17b-16e-instruct
"""

import os
from groq import Groq

def test_groq_api():
    # Get API key from environment variable
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        print("❌ Error: GROQ_API_KEY environment variable not set!")
        print("Please set it with: $env:GROQ_API_KEY = 'your_api_key_here'")
        return False

    try:
        print(f"🔑 Using API key: {api_key[:10]}...")
        print("🤖 Testing model: meta-llama/llama-4-scout-17b-16e-instruct")

        # Initialize Groq client
        client = Groq(api_key=api_key)

        # Test the model with a simple message
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Hello! Please respond with just 'Groq API test successful!' if you can read this."
                }
            ],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            max_tokens=50,
            temperature=0.1
        )

        response = chat_completion.choices[0].message.content.strip()
        print(f"✅ API call successful!")
        print(f"📝 Response: {response}")

        if "successful" in response.lower():
            print("🎉 Groq API key is working correctly!")
            return True
        else:
            print("⚠️  API responded but with unexpected content")
            return True

    except Exception as e:
        print(f"❌ Error: {e}")
        if "invalid" in str(e).lower() or "unauthorized" in str(e).lower():
            print("💡 This usually means your API key is invalid or expired")
        elif "model" in str(e).lower():
            print("💡 This might mean the model name is incorrect or not available")
        return False

if __name__ == "__main__":
    print("🚀 Testing Groq API connection...")
    success = test_groq_api()
    if success:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed. Please check your API key and try again.")