# Astra AI Provider Failover System

![Astra Logo](https://via.placeholder.com/150) <!-- Replace with Astra logo -->

**A production-grade failover and round-robin load distribution system for AI providers.**

This system ensures **high availability, fair load distribution, and automatic failover** for AI model APIs (e.g., Groq, NVIDIA NIM, Hugging Face). It is designed to:
- **Automatically switch** to the next available provider if one hits a rate limit (HTTP 429) or fails.
- **Distribute initial load equally** across providers using a **Round Robin approach** to prevent "burning through" one provider prematurely.
- **Act as a microservice** for seamless integration into the Trestle Protocol ecosystem.

---

## 🚀 Features

### **1. Failover Mechanism**
- Automatically detects **HTTP 429 (Rate Limit)** and **connection errors**.
- Falls back to the next available provider **without interrupting user requests**.
- Logs errors for **observability and debugging**.

### **2. Round Robin Load Distribution**
- Distributes requests **equally** across all configured providers.
- Uses a **circular index** to ensure fair rotation.
- Prevents **overloading a single provider** during high traffic.

### **3. Microservice-Ready**
- Designed to run as a **standalone Node.js microservice**.
- Can be deployed on **AWS Lambda, Google Cloud Run, or any Node.js hosting environment**.
- Supports **environment variables** for secure API key management.

### **4. Extensible Provider Configuration**
- Supports **multiple AI providers** (e.g., Groq, NVIDIA NIM, Hugging Face).
- Easy to **add or remove providers** without code changes.
- Customizable **request/response handling** for each provider.

---

## 📁 Directory Structure

```
trestle-AI/
├── index.js            # Core failover and round-robin logic
├── README.md           # This documentation
├── .env.example        # Example environment variables
└── package.json        # Node.js dependencies and scripts
```

---

## ⚙️ Setup & Installation

### **Prerequisites**
- **Node.js** (v18+ recommended).
- **npm** or **Yarn**.
- API keys for the AI providers you want to use (e.g., Groq, NVIDIA NIM, Hugging Face).

### **Installation**
1. Clone the repository and navigate to the `trestle-AI` directory:
   ```bash
   git clone https://github.com/Trestle-Protocol/trestle.git
   cd trestle/trestle-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to the `.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key
   NVIDIA_API_KEY=your_nvidia_api_key
   HF_API_KEY=your_hugging_face_api_key
   ```

---

## 🛠 Configuration

### **Providers Setup**
Configure your AI providers in `index.js`:

```javascript
const providers = [
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192'
  },
  {
    name: 'NVIDIA NIM',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    apiKey: process.env.NVIDIA_API_KEY,
    model: 'meta/llama-3-8b-instruct'
  },
  {
    name: 'Hugging Face',
    url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
    apiKey: process.env.HF_API_KEY,
    model: null // Hugging Face uses the URL for the model
  }
];
```

### **Customizing Requests**
Modify the `callProvider` function in `index.js` to match the API specifications of your providers. For example:

```javascript
async callProvider(provider, messages) {
  const payload = {
    model: provider.model,
    messages: messages,
    max_tokens: 500,
    temperature: 0.7
  };

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 429) {
    throw new Error('Rate limit exceeded');
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
```

---

## ▶️ Running the Script

### **Local Development**
Run the script locally for testing:

```bash
node index.js
```

### **Production Deployment**
Deploy the script as a **microservice** using your preferred hosting provider:

#### **Option 1: AWS Lambda**
1. Install the [AWS CLI](https://aws.amazon.com/cli/) and configure your credentials.
2. Use the [Serverless Framework](https://www.serverless.com/) to deploy:
   ```bash
   npm install -g serverless
   serverless deploy
   ```

#### **Option 2: Google Cloud Run**
1. Build a Docker image:
   ```bash
   docker build -t trestle-ai-failover .
   ```
2. Push the image to Google Container Registry:
   ```bash
   docker push gcr.io/your-project-id/trestle-ai-failover
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy --image gcr.io/your-project-id/trestle-ai-failover --platform managed
   ```

#### **Option 3: Vercel/Netlify**
1. Create a `vercel.json` or `netlify.toml` configuration file.
2. Deploy using the Vercel or Netlify CLI:
   ```bash
   vercel --prod
   # or
   netlify deploy --prod
   ```

---

## 🔄 Round Robin Logic

The **Round Robin** approach ensures that requests are distributed equally across all providers. Here’s how it works:

1. **Initialization**: The `currentIndex` is set to `0`.
2. **Request Handling**: For each request, the system starts with the provider at `currentIndex`.
3. **Success Path**: If a provider succeeds, `currentIndex` is updated to `(currentIndex + 1) % providers.length`.
4. **Failover Path**: If a provider fails (e.g., rate limit or error), the system moves to the next provider in the list.
5. **Circular Rotation**: The modulo operator (`%`) ensures the index wraps around to `0` after reaching the end of the list.

### **Example Flow**
```
Providers: [Groq, NVIDIA NIM, Hugging Face]

Request 1: Starts at Groq (index 0) → Success → Next index: 1
Request 2: Starts at NVIDIA NIM (index 1) → Rate limited → Falls back to Hugging Face (index 2) → Success → Next index: 0
Request 3: Starts at Groq (index 0) → Success → Next index: 1
```

---

## 🛡 Security & Best Practices

### **1. Environment Variables**
- **Never hardcode API keys** in the script. Always use environment variables.
- Use a `.env` file for local development and **secret management tools** (e.g., AWS Secrets Manager, Google Secret Manager) in production.

### **2. Rate Limit Handling**
- Implement **exponential backoff** for providers that support it.
- Log rate limit errors for **observability and debugging**.

### **3. Error Handling**
- Catch and log **all errors** to monitor provider performance.
- Provide **meaningful error messages** to users without exposing sensitive information.

### **4. Observability**
- Use **logging tools** (e.g., Winston, Morgan) to track requests and errors.
- Integrate with **monitoring tools** (e.g., Prometheus, Datadog) to track provider latency and success rates.

---

## 📡 API Endpoints (Microservice Mode)

When deployed as a microservice, the system exposes the following endpoints:

| Endpoint               | Method | Description                                                                                     |
|------------------------|--------|-------------------------------------------------------------------------------------------------|
| `/api/generate`        | POST   | Accepts a prompt and returns an AI-generated response using the failover system.              |
| `/api/providers`       | GET    | Returns a list of configured providers and their status (e.g., available, rate-limited).       |
| `/api/health`          | GET    | Returns the health status of the microservice.                                                 |

### **Example Request**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello, how are you?"}]}'
```

### **Example Response**
```json
{
  "provider": "Groq",
  "response": {
    "choices": [
      {
        "message": {
          "content": "I'm doing well, thank you! How can I assist you today?"
        }
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### **1. Provider Fails to Respond**
- **Check the API key**: Ensure the API key is correct and has not expired.
- **Check the endpoint**: Verify that the provider’s URL is correct and accessible.
- **Check rate limits**: Monitor the provider’s rate limits and adjust your request volume.

### **2. Script Crashes**
- **Check logs**: Review the logs for errors or unhandled exceptions.
- **Validate input**: Ensure the input data (e.g., messages) is correctly formatted.
- **Test locally**: Run the script locally to debug issues before deploying.

### **3. High Latency**
- **Monitor providers**: Use observability tools to identify slow providers.
- **Optimize payloads**: Reduce the size of the request payload (e.g., limit `max_tokens`).
- **Scale horizontally**: Deploy multiple instances of the microservice to handle high traffic.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 📬 Contact

For questions or support, contact the Trestle Protocol team:
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-Protocol)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.m/TrestlePro)
- **Email**: contact@trestle.website

---

**Astra: Your intelligent, resilient AI gateway.**

# Load API keys from environment variables (for security)
GROQ_API_KEY=your_groq_api_key
NVIDIA_API_KEY=your_nvidia_api_key
HF_API_KEY=your_hugging_face_api_key


npx hardhat verify --network polygon 0x8E3Dd0B0E261b16226E6DFBA080AEBb2431E2F44 0xd1BCF94ef96564e4D51516dF039f333dE592c528

npx hardhat verify --network polygon 0xc77BDD46cD06C880609837a172BEA010daB19A12 0x8E3Dd0B0E261b16226E6DFBA080AEBb2431E2F44 0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD 0xd1BCF94ef96564e4D51516dF039f333dE592c528
