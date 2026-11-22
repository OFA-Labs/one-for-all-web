"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  GitPullRequest,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "./provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  EmptyState,
  IntegrationButton,
  Notice,
  PageTitle,
  Pill,
} from "./common";
import { scenarios, type ScenarioId } from "@/lib/demo";

// A specialized agent is deliberately small: one Markdown instruction file and
// one or more spoken phrases that invoke it. Nothing here depends on any
// external agent framework's internals — it is a plain local registry.
type Agent = {
  id: string;
  name: string;
  description: string;
  file: string;
  instructions: string;
  triggers: string[];
};

const sampleAgents: Agent[] = [
  {
    id: "sample-pr",
    name: "PR reviewer",
    description: "Summarises a pull request and flags the riskiest change.",
    file: "pr-reviewer.md",
    instructions:
      "# PR reviewer\n\nRead the diff, then summarise the change in three lines. Call out anything that touches permissions or data retention.",
    triggers: ["review this PR", "check the pull request"],
  },
  {
    id: "sample-research",
    name: "Research digest",
    description: "Turns a set of sources into a short, cited brief.",
    file: "research-digest.md",
    instructions:
      "# Research digest\n\nCompare the sources, keep only claims you can point at, and finish with what is still unknown.",
    triggers: ["digest these sources", "research this for me"],
  },
];

const blankAgent = (): Agent => ({
  id: "",
  name: "",
  description: "",
  file: "",
  instructions: "",
  triggers: [""],
});

const newAgentId = () =>
  `agent-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function Playground() {
  const { start, integrate } = useApp();
  const router = useRouter();
  const [active, setActive] = useState("tasks");

  // Agents registry — local, in-memory state for this frontend preview.
  const [agents, setAgents] = useState<Agent[]>(sampleAgents);
  const [draft, setDraft] = useState<Agent>(blankAgent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [agentError, setAgentError] = useState("");

  const openNewAgent = () => {
    setDraft(blankAgent());
    setEditingId(null);
    setAgentError("");
    setFormOpen(true);
  };
  const openEditAgent = (agent: Agent) => {
    setDraft({ ...agent, triggers: [...agent.triggers] });
    setEditingId(agent.id);
    setAgentError("");
    setFormOpen(true);
  };
  const saveAgent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = draft.name.trim();
    const file =
      draft.file.trim() ||
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "agent"}.md`;
    const triggers = draft.triggers.map((t) => t.trim()).filter(Boolean);
    if (!name) {
      setAgentError("Give the agent a name.");
      return;
    }
    if (!draft.instructions.trim()) {
      setAgentError("Add the Markdown instructions for this agent.");
      return;
    }
    if (!triggers.length) {
      setAgentError("Add at least one spoken trigger phrase.");
      return;
    }
    const saved: Agent = {
      ...draft,
      id: editingId ?? newAgentId(),
      name,
      file,
      triggers,
    };
    setAgents((current) =>
      editingId
        ? current.map((a) => (a.id === editingId ? saved : a))
        : [...current, saved],
    );
    setFormOpen(false);
    setAgentError("");
    setDraft(blankAgent());
    setEditingId(null);
  };
  const setTrigger = (index: number, value: string) =>
    setDraft((current) => ({
      ...current,
      triggers: current.triggers.map((t, i) => (i === index ? value : t)),
    }));
  const addTrigger = () =>
    setDraft((current) => ({
      ...current,
      triggers: [...current.triggers, ""],
    }));
  const removeTrigger = (index: number) =>
    setDraft((current) => ({
      ...current,
      triggers: current.triggers.filter((_, i) => i !== index),
    }));
  const loadInstructionFile = async (file?: File) => {
    if (!file) return;
    if (!/\.md$/i.test(file.name)) {
      setAgentError("Choose a .md instruction file.");
      return;
    }
    const text = await file.text();
    setDraft((current) => ({ ...current, file: file.name, instructions: text }));
    setAgentError("");
  };

  const run = (id: ScenarioId) =>
    integrate(scenarios[id].feature, () => {
      start(id);
      router.push(`/tasks/preview-${id}`);
    });
  return (
    <>
      <PageTitle
        title="Try it, without the stakes."
        description="A small world of sample tasks. No logins, no public posts, no real applications."
        action={<Pill>Safe sample environment</Pill>}
      />
      <Notice>
        Playground pages are illustrative test surfaces. They don’t control real
        Chrome, call models, or run security tests against external sites.
      </Notice>
      <Tabs value={active} onValueChange={setActive} className="mt-6">
        <TabsList>
          <TabsTrigger value="tasks">Task previews</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="scenario-grid">
            {(
              [
                { id: "pr", icon: GitPullRequest },
                { id: "jobs", icon: BriefcaseBusiness },
                { id: "social", icon: Send },
                { id: "decline", icon: ShieldCheck },
              ] as const
            ).map(({ id, icon: Icon }) => (
              <section className="scenario-card" key={id}>
                <span className="scenario-icon">
                  <Icon size={22} />
                </span>
                <h2>{scenarios[id].name}</h2>
                <p>{scenarios[id].description}</p>
                <blockquote>“{scenarios[id].prompt}”</blockquote>
                <div className="button-row">
                  <Button
                    variant={id === "decline" ? "outline" : "default"}
                    onClick={() => run(id)}
                  >
                    Run {id === "decline" ? "refusal" : "task"} preview
                    <ArrowRight size={15} />
                  </Button>
                  <IntegrationButton
                    id={scenarios[id].feature}
                    label={`${scenarios[id].name} details`}
                  />
                </div>
              </section>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="agents">
          <section className="panel mt-6">
            <div className="section-heading">
              <h2>Specialized agents</h2>
              <Pill>{agents.length} registered</Pill>
            </div>
            <Notice>
              A local registry of specialists. Each agent is one Markdown
              instruction file plus the spoken phrases that invoke it — “when I
              say X, run this agent.” Everything is kept in memory for this
              preview; nothing connects to an external agent framework or runs
              a real agent.
            </Notice>
            <div className="button-row">
              <Button onClick={openNewAgent}>
                <Bot size={16} aria-hidden="true" />
                Add agent
              </Button>
            </div>

            {formOpen && (
              <form className="form-grid mt-6" onSubmit={saveAgent}>
                <div className="field">
                  <label htmlFor="agent-name">Agent name</label>
                  <Input
                    id="agent-name"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    placeholder="e.g. PR reviewer"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="agent-file">Instruction file (.md)</label>
                  <Input
                    id="agent-file"
                    value={draft.file}
                    onChange={(e) =>
                      setDraft({ ...draft, file: e.target.value })
                    }
                    placeholder="pr-reviewer.md"
                  />
                  <p className="small muted">
                    One Markdown file holds this agent’s instructions.
                  </p>
                </div>
                <div className="field full">
                  <label htmlFor="agent-description">
                    What it does (optional)
                  </label>
                  <Input
                    id="agent-description"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    placeholder="A short description of this specialist."
                  />
                </div>
                <div className="field full">
                  <label htmlFor="agent-instructions">
                    Instructions (Markdown)
                  </label>
                  <Textarea
                    id="agent-instructions"
                    value={draft.instructions}
                    onChange={(e) =>
                      setDraft({ ...draft, instructions: e.target.value })
                    }
                    rows={8}
                    placeholder="# Agent name&#10;&#10;Describe the steps, rules and output format here."
                  />
                  <p className="small muted">
                    This text is the contents of the instruction file.
                  </p>
                </div>
                <div className="field full">
                  <label htmlFor="agent-local-file">
                    Load a local .md file (optional)
                  </label>
                  <Input
                    id="agent-local-file"
                    type="file"
                    accept=".md,text/markdown"
                    onChange={(e) =>
                      void loadInstructionFile(e.target.files?.[0])
                    }
                  />
                  <p className="small muted">
                    File text is read in this browser only. Nothing is uploaded.
                  </p>
                </div>
                <div
                  className="field full"
                  role="group"
                  aria-labelledby="agent-triggers-label"
                >
                  <span id="agent-triggers-label" className="text-sm font-medium">
                    Spoken trigger phrases
                  </span>
                  <p className="small muted">
                    “When I say this, run this agent.” Add one or more phrases.
                  </p>
                  <div className="stack mt-2">
                    {draft.triggers.map((trigger, index) => (
                      <div className="form-grid" key={index}>
                        <div className="field">
                          <Input
                            aria-label={`Trigger phrase ${index + 1}`}
                            value={trigger}
                            onChange={(e) => setTrigger(index, e.target.value)}
                            placeholder="e.g. review this PR"
                          />
                        </div>
                        <div className="field">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTrigger(index)}
                            disabled={draft.triggers.length === 1}
                          >
                            Remove phrase
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTrigger}
                  >
                    Add another phrase
                  </Button>
                </div>
                {agentError && (
                  <p className="field-error full" role="alert">
                    {agentError}
                  </p>
                )}
                <div className="button-row full">
                  <Button type="submit">Save agent</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {agents.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No agents yet"
                description="Add a specialist with one Markdown instruction file and the phrases that invoke it."
              >
                <Button onClick={openNewAgent}>Add your first agent</Button>
              </EmptyState>
            ) : (
              <div className="scenario-grid">
                {agents.map((agent) => (
                  <article className="scenario-card" key={agent.id}>
                    <span className="scenario-icon">
                      <Bot size={22} aria-hidden="true" />
                    </span>
                    <div className="section-heading">
                      <h2>{agent.name}</h2>
                      <div className="button-row" style={{ marginTop: 0 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditAgent(agent)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setAgents((current) =>
                              current.filter((a) => a.id !== agent.id),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {agent.description && <p>{agent.description}</p>}
                    <p className="small muted mt-2">
                      Instruction file: <strong>{agent.file}</strong>
                    </p>
                    <div className="mt-4">
                      <span className="small muted">
                        Run this agent when you say
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {agent.triggers.map((trigger) => (
                          <span className="pill" key={trigger}>
                            “{trigger}”
                          </span>
                        ))}
                      </div>
                    </div>
                    <details className="mt-4">
                      <summary className="text-button">
                        View Markdown instructions
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                        {agent.instructions}
                      </pre>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
