# n8n Workflow for Custom Files

The backend works without n8n. If you want n8n to generate the website files, create a workflow like this:

```txt
Webhook Trigger
  ↓
AI Agent / Code / Template Logic
  ↓
Respond to Webhook
```

## Webhook Trigger

Method: `POST`

Example payload sent by backend:

```json
{
  "repoName": "my-generated-website",
  "description": "Website generated from my builder",
  "isPrivate": false,
  "githubUser": {
    "login": "octocat",
    "avatar_url": "https://..."
  }
}
```

## Respond to Webhook

Return JSON:

```json
{
  "files": [
    {
      "path": "src/App.jsx",
      "content": "export default function App() { return <h1>Hello from n8n</h1>; }\n"
    }
  ]
}
```

Any returned file with the same path as the default template replaces that default file.
