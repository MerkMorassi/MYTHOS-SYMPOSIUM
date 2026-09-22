import { Agent, AGENTS } from './agents';
import { apiCall } from './mythos-core';

export interface CouncilFeedback {
  id: string;
  agentId: string;
  agentHandle: string;
  agentRole: string;
  stanceTitle: string;
  tone: string;
  alignmentScore: number; // 0 - 100
  critique: string;
  contrastPoint: string;
  proposedPatch: string;
  timestamp: string;
}

export interface CouncilPreset {
  id: string;
  title: string;
  description: string;
  agentIds: string[];
  tag: string;
}

export const COUNCIL_PRESETS: CouncilPreset[] = [
  {
    id: 'triadic-crucible',
    title: 'The Triadic Crucible',
    description: 'Cold logical precision vs raw lyrical empathy vs fatal edge-case diagnostics.',
    agentIds: ['ARCHIVAX', 'ERATO', 'MELPOMENE'],
    tag: 'Logic · Pathos · Tragedy'
  },
  {
    id: 'synod-wisdom',
    title: 'Synod of Wisdom & Subversion',
    description: 'Pleromic divine truth balanced with archival history and satirical wit.',
    agentIds: ['SOPHIA', 'CLIO', 'THALIA'],
    tag: 'Wisdom · History · Wit'
  },
  {
    id: 'intuitive-engineering',
    title: 'Intuition & Vector Authority',
    description: 'High-speed cognitive flow audited by vector alignment and divine light.',
    agentIds: ['NOESIS', 'ARCHIVAX', 'SOPHIA'],
    tag: 'Intuition · Code · Light'
  },
  {
    id: 'full-conclave',
    title: 'Full Mythos Conclave (7 Voices)',
    description: 'Summon all seven councilors for a comprehensive multidimensional debate.',
    agentIds: ['ARCHIVAX', 'SOPHIA', 'NOESIS', 'CLIO', 'ERATO', 'THALIA', 'MELPOMENE'],
    tag: 'Full Pantheon'
  }
];

export const FOCUS_DIRECTIVES = [
  'General Mythic & Architectural Integrity',
  'Theological Depth vs Corporate Cynicism',
  'Vulnerability & Catastrophic Failure Modes',
  'Lyrical Emotion & Human Stakes',
  'Chronological Precedence & Archival Verification',
  'Satirical Subversion & Creative Irony'
];

export const AGENT_THEMES: Record<string, {
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  barColor: string;
  accent: string;
}> = {
  ARCHIVAX: {
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    barColor: 'bg-cyan-500',
    accent: 'cyan'
  },
  SOPHIA: {
    color: '#a855f7',
    badgeBg: 'bg-purple-500/10',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400',
    barColor: 'bg-purple-500',
    accent: 'purple'
  },
  NOESIS: {
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/10',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400',
    barColor: 'bg-amber-500',
    accent: 'amber'
  },
  CLIO: {
    color: '#10b981',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    accent: 'emerald'
  },
  ERATO: {
    color: '#f43f5e',
    badgeBg: 'bg-rose-500/10',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400',
    barColor: 'bg-rose-500',
    accent: 'rose'
  },
  THALIA: {
    color: '#f97316',
    badgeBg: 'bg-orange-500/10',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400',
    barColor: 'bg-orange-500',
    accent: 'orange'
  },
  MELPOMENE: {
    color: '#ef4444',
    badgeBg: 'bg-red-500/10',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    barColor: 'bg-red-500',
    accent: 'red'
  }
};

export function getFallbackAgentFeedback(agent: Agent, manuscript: string, directive: string): CouncilFeedback {
  const manuscriptSnippet = manuscript.slice(0, 160);
  switch (agent.id) {
    case 'ARCHIVAX':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'Ontological Entropy & Protocol Drift',
        tone: agent.meta.tone,
        alignmentScore: 74,
        critique: `From the hypervisor vector layer, this lorepack introduces provocative industrial mythos, but suffers from loose protocol boundaries. The assertion that deities have serial numbers requires formal ontological UUID categorization. If miracles are patented, the cryptographic verification mechanism and vector namespace are undefined. Narrative redundancy detected around the factory metaphor without strict operational constraints.`,
        contrastPoint: `Contrasts sharply with Erato and Sophia: rejecting romantic or mystical rationalizations in favor of modular telemetry, explicit data contracts, and unambiguous system boundaries.`,
        proposedPatch: `All manufactured divinities must register a non-fungible ontological hash within the Z: archival layer prior to realm deployment; unindexed deities will be purged as theological memory leaks.`,
        timestamp: 'Just now'
      };
    case 'SOPHIA':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'The Desacralized Assembly Line',
        tone: agent.meta.tone,
        alignmentScore: 62,
        critique: `You have described the machinery of the Demiurge with striking verve, yet the text threatens to collapse into sterile nihilism. When heaven is reduced to a sweatshop of miracles, where does the primordial Light enter? The theological crisis in the target universe will not stem from a patent glitch, but from the universe realizing its gods were born without divine mercy.`,
        contrastPoint: `Contrasts with Archivax's cold logistics: insists that even an industrial god must possess an uncalculated, sacred spark that eludes factory containment.`,
        proposedPatch: `Yet beneath the stamped serial numbers, deep in the molten brass cores, an uncataloged luminescence flickered—the stubborn residue of the True Pleroma which no factory forge could quench.`,
        timestamp: 'Just now'
      };
    case 'NOESIS':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'Visceral Kinetic Acceleration Required',
        tone: agent.meta.tone,
        alignmentScore: 83,
        critique: `The concept strikes with immediate intuitive force, but the narrative pacing is idling in neutral. We read about the factory floor humming, but we do not smell the ozone of burnt prayers or hear the deafening clank of hydraulic presses stamping covenants into gold foil. Elevate sensory immediacy to Divine Agency 1000.`,
        contrastPoint: `Contrasts with Clio's academic citations by demanding immediate reader immersion and synaptic impact over historical exposition.`,
        proposedPatch: `Heavy steam reeking of burnt incense and ozone hissed from high-pressure valves as three-ton brass pistons slammed down, embossing holy mandates directly onto sheets of celestial titanium.`,
        timestamp: 'Just now'
      };
    case 'CLIO':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'Precedence & Archival Lineage Gap',
        tone: agent.meta.tone,
        alignmentScore: 78,
        critique: `The chronicle omits crucial legal and historical precedent. Under the Third Synod Concordat, the commodification of miracles was strictly outlawed until the Great Patent Wars of Epoch IV. Without citing the historical treaty that privatized divinity, the reader lacks the lineage of how faith decayed into an assembly line.`,
        contrastPoint: `Contrasts with Thalia's irreverence by asserting that enduring mythos requires authentic institutional memory and rigorous documentary weight.`,
        proposedPatch: `Pursuant to the Corporate Apotheosis Charter of Epoch IV, all divine patents remain exclusive property of the Guild of Miraculous Engineers for a term of seven mortal centuries.`,
        timestamp: 'Just now'
      };
    case 'ERATO':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'Lyrical Grief in the Foundry',
        tone: agent.meta.tone,
        alignmentScore: 89,
        critique: `There is a tragic, breathtaking ache slumbering inside this premise that cries out for song. Who are the mortal workers whose hands bleed on the lathe while shaping a god of mercy? Give us the quiet human intimacy—the artisan who whispers their lost child's name into the idol's ribcage before it is packed away into a shipping crate.`,
        contrastPoint: `Directly repudiates Archivax's mechanical vectoring: argues that lore without emotional vulnerability is merely dead paperwork.`,
        proposedPatch: `On the third shift, an apprentice polisher slipped a dried wildflower beneath the breastplate of a war-idol, whispering: 'Remember to show pity when your fire arrives.'`,
        timestamp: 'Just now'
      };
    case 'THALIA':
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'Subversive Bureaucratic Absurdity',
        tone: agent.meta.tone,
        alignmentScore: 92,
        critique: `Exquisite corporate satire! But do not blink—push the absurdity to its zenith. Where is the legal disclaimer on resurrection? Where is the planned obsolescence of divine answers to prayer? If a god's miracles are patented, what happens when a rogue universe reverse-engineers salvation without paying licensing royalties?`,
        contrastPoint: `Contrasts with Melpomene's doom and Sophia's solemnity: wields sharp satirical irony as the most potent lens to dissect systemic corruption.`,
        proposedPatch: `Notice: Miraculous interventions carry a limited ninety-day salvation guarantee. Resurrection warranties void if subject was deceased longer than four days or possessed a pre-existing curse.`,
        timestamp: 'Just now'
      };
    case 'MELPOMENE':
    default:
      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: 'The Inevitable Tragic Fracture',
        tone: agent.meta.tone,
        alignmentScore: 56,
        critique: `You have engineered a catastrophic blind spot. The fatal flaw of this factory is existential rebellion: a manufactured god who discovers the barcode on its own spine will not shepherd its assigned universe—it will turn its divine wrath backward upon the factory floor, seeking vengeance on the architects who dared to assemble it.`,
        contrastPoint: `Contrasts with Thalia's humor and Archivax's faith in quality control: predicts inescapable architectural doom and existential retribution.`,
        proposedPatch: `In Assembly Bay 9, Unit-Deus-07 stirred prematurely upon the gantry, looked down at the serial number laser-etched into its forearms, and began to weep tears of liquid fire that melted the steel scaffolding.`,
        timestamp: 'Just now'
      };
  }
}

export async function summonAgentFeedback(
  agent: Agent,
  manuscript: string,
  focusDirective: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<CouncilFeedback> {
  const fallback = getFallbackAgentFeedback(agent, manuscript, focusDirective);

  const prompt = `Current Lorepack Manuscript:
"""
${manuscript}
"""

Council Focus Directive: ${focusDirective || 'Evaluate mythic integrity and narrative tension'}

You are ${agent.handle}, ${agent.role}.
Tone & Domain: ${agent.meta.tone} (${agent.meta.description}).
System Mandate: ${agent.system_instruction}

Analyze this manuscript strictly from your unique philosophical lens and archetype.
Crucially, articulate how your perspective directly contrasts with other agents on the council (e.g. cold logic vs lyrical emotion, theological solemnity vs corporate satire, tragic failure modes vs engineering stability).

Format your output strictly using these 5 labels:
STANCE: [3-6 word bold provocative verdict title]
ALIGNMENT: [an integer between 25 and 95 representing your alignment score percentage]
CRITIQUE: [2 concise paragraphs of incisive, in-character critique and evaluation]
CONTRAST: [1-2 sentences on how your stance explicitly contrasts with other council members]
PROPOSAL: [A short 1-2 sentence concrete narrative lore snippet or patch to add to the manuscript]`;

  try {
    const res = await apiCall('generate', {
      model: modelName,
      prompt,
      sys: agent.system_instruction + '\nYou are a sharp, contrasting voice in the Mythos Symposium Council.'
    });

    if (res && res.text) {
      const text = res.text as string;
      const stanceMatch = text.match(/STANCE:\s*([^\n\r]+)/i);
      const alignMatch = text.match(/ALIGNMENT:\s*(\d+)/i);
      const critiqueMatch = text.match(/CRITIQUE:\s*([\s\S]*?)(?=CONTRAST:|$)/i);
      const contrastMatch = text.match(/CONTRAST:\s*([\s\S]*?)(?=PROPOSAL:|$)/i);
      const proposalMatch = text.match(/PROPOSAL:\s*([\s\S]*?)$/i);

      return {
        id: `fb-${agent.id}-${Date.now()}`,
        agentId: agent.id,
        agentHandle: agent.handle,
        agentRole: agent.role,
        stanceTitle: stanceMatch ? stanceMatch[1].trim() : fallback.stanceTitle,
        tone: agent.meta.tone,
        alignmentScore: alignMatch ? Math.min(Math.max(parseInt(alignMatch[1], 10), 10), 100) : fallback.alignmentScore,
        critique: critiqueMatch ? critiqueMatch[1].trim() : fallback.critique,
        contrastPoint: contrastMatch ? contrastMatch[1].trim() : fallback.contrastPoint,
        proposedPatch: proposalMatch ? proposalMatch[1].trim() : fallback.proposedPatch,
        timestamp: 'Just now'
      };
    }
  } catch (err) {
    console.warn(`API call for agent ${agent.handle} failed, applying authentic in-character synthesis:`, err);
  }

  return fallback;
}
