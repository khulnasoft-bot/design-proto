import { ProjectTemplate } from "../types";

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "product-launch",
    name: "Product Launch Strategizer",
    description: "Comprehensive structure for planning and executing a new product rollout.",
    category: "Operations",
    nodes: [
      { content: "Product Launch Overview", type: "thought", position: { x: 400, y: 100 } },
      { content: "Target Audience Definition", type: "fact", position: { x: 100, y: 300 } },
      { content: "Competitive Analysis", type: "fact", position: { x: 300, y: 300 } },
      { content: "Marketing Channels", type: "thought", position: { x: 500, y: 300 } },
      { content: "Pricing Strategy", type: "thought", position: { x: 700, y: 300 } },
      { content: "Launch Success Metrics", type: "synthesis", position: { x: 400, y: 500 } },
    ],
    tasks: [
      { title: "Define launch date", priority: "high", completed: false },
      { title: "Finalize marketing assets", priority: "medium", completed: false },
      { title: "Set up analytics tracking", priority: "high", completed: false },
      { title: "Brief sales and support teams", priority: "medium", completed: false },
    ],
    businessMemory: {
      industry: "Technology",
      brandVoice: "Confident, helpful, and forward-thinking."
    }
  },
  {
    id: "market-research",
    name: "Market Deep Dive",
    description: "A framework for analyzing market trends, customer needs, and gaps.",
    category: "Research",
    nodes: [
      { content: "Market Landscape Analysis", type: "query", position: { x: 400, y: 100 } },
      { content: "Current Market Trends", type: "fact", position: { x: 200, y: 300 } },
      { content: "Key Customer Pain Points", type: "fact", position: { x: 400, y: 300 } },
      { content: "Competitor Market Share", type: "fact", position: { x: 600, y: 300 } },
      { content: "SWOT Analysis", type: "synthesis", position: { x: 400, y: 500 } },
    ],
    tasks: [
      { title: "Identify top 5 competitors", priority: "medium", completed: false },
      { title: "Gather customer review data", priority: "medium", completed: false },
      { title: "Draft executive summary", priority: "high", completed: false },
    ]
  },
  {
    id: "feature-spec",
    name: "Feature Specification",
    description: "Technical and functional planning for a new product feature.",
    category: "Engineering",
    nodes: [
      { content: "Feature Goal & Vision", type: "thought", position: { x: 400, y: 100 } },
      { content: "User Stories", type: "thought", position: { x: 200, y: 300 } },
      { content: "Technical Requirements", type: "fact", position: { x: 400, y: 300 } },
      { content: "UI/UX Flows", type: "thought", position: { x: 600, y: 300 } },
      { content: "Risk Assessment", type: "synthesis", position: { x: 400, y: 500 } },
    ],
    tasks: [
      { title: "Define acceptance criteria", priority: "high", completed: false },
      { title: "Review technical feasibility", priority: "high", completed: false },
      { title: "Create design wireframes", priority: "medium", completed: false },
    ]
  },
  {
    id: "user-interview",
    name: "User Interview Analysis",
    description: "Synthesize insights from user research and interviews.",
    category: "Research",
    nodes: [
      { content: "Research Objective", type: "thought", position: { x: 400, y: 100 } },
      { content: "Key Observations", type: "fact", position: { x: 200, y: 300 } },
      { content: "Common Patterns", type: "synthesis", position: { x: 400, y: 300 } },
      { content: "Unexpected Insights", type: "fact", position: { x: 600, y: 300 } },
      { content: "Actionable Recommendations", type: "thought", position: { x: 400, y: 500 } },
    ],
    tasks: [
      { title: "Transcribe interview recordings", priority: "medium", completed: false },
      { title: "Code key themes", priority: "medium", completed: false },
      { title: "Share findings with team", priority: "high", completed: false },
    ]
  }
];
