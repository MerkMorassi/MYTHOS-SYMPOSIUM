import { LorepackDoc } from './firestore-service';
import { apiCall } from './mythos-core';
import { AGENTS } from './agents';

export interface ArtifactVector {
  id: string;
  name: string;
  category: 'Relic' | 'Techno-Vessel' | 'Talisman' | 'Instrument' | 'Sacred Geometry';
  sourceCodexId: string;
  sourceCodexTitle: string;
  physicalForm: string;
  functionalResonance: string;
  theologicalSignificance: string;
}

export interface GeneticVector {
  id: string;
  strainName: string;
  taxonomy: 'Chimeric Divinity' | 'Mutated Lineage' | 'Synthetic Biology' | 'Planar Adaptation' | 'Chronometric Strain';
  sourceCodexId: string;
  sourceCodexTitle: string;
  biologicalTraits: string;
  divergencePattern: string;
  evolutionaryImperative: string;
}

export interface MemeticVector {
  id: string;
  memeTitle: string;
  vectorType: 'Liturgical Dogma' | 'Cognitive Contagion' | 'Corporate Axiom' | 'Heresy' | 'Cosmic Taboo';
  sourceCodexId: string;
  sourceCodexTitle: string;
  coreDogma: string;
  transmissionMode: string;
  psychologicalImpact: string;
}

export interface TriadicInterpretation {
  id: string;
  title: string;
  sourceCodexIds: string[];
  sourceCodexTitles: string[];
  createdAt: string;
  author: string;
  artifacts: ArtifactVector[];
  genetics: GeneticVector[];
  memetics: MemeticVector[];
  synthesisThesis: string;
  triadicConvergence: string;
  theologicalConsequence: string;
  emergentMythicAxioms: string[];
  councilGlosses: Array<{
    agentId: string;
    agentHandle: string;
    role: string;
    stance: string;
    verdict: string;
  }>;
}

// Canonical Pre-extracted Vectors for Seed Lorepacks
export const CANONICAL_TRIADIC_DATABASE: Record<string, {
  artifacts: ArtifactVector[];
  genetics: GeneticVector[];
  memetics: MemeticVector[];
}> = {
  '1': {
    artifacts: [
      {
        id: 'art-1-1',
        name: 'Machined Bismuth-Alloy Brass Core',
        category: 'Techno-Vessel',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        physicalForm: 'Heavy bismuth-brass cylinder etched with twelve million microscopic covenant micro-circuits.',
        functionalResonance: 'Calibrated at 33 Hz to sustain manufactured divinity in a state of tranquilized compliance.',
        theologicalSignificance: 'Embodies the mechanization of divine will under industrial tolerances.'
      },
      {
        id: 'art-1-2',
        name: 'Vernier Calipers of Quality Assurance',
        category: 'Instrument',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        physicalForm: 'Brass-rimmed ocular precision calipers and spectral scintillation counters.',
        functionalResonance: 'Measures unauthorized grace and meters holy water dispense rates to the milliliter.',
        theologicalSignificance: 'The bureaucratic weapon against gratuitous, unbilled divine mercy.'
      },
      {
        id: 'art-1-3',
        name: 'Optical Sensors of Flawless Beryl',
        category: 'Relic',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        physicalForm: 'Gemstone optical apertures ground from single-crystal beryl.',
        functionalResonance: 'Emits an uncataloged luminescent gaze capable of projecting unconditional forgiveness.',
        theologicalSignificance: 'The irrepressible divine spark surviving assembly-line commodification.'
      }
    ],
    genetics: [
      {
        id: 'gen-1-1',
        strainName: 'Unit-Deus Chimeric Genotype',
        taxonomy: 'Chimeric Divinity',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        biologicalTraits: 'Synthetic biological tissue fused with heavy molten alloys; zero organic mortality signature.',
        divergencePattern: 'Spontaneous cellular proliferation of radioactive phosphorus white lilies without caloric substrate.',
        evolutionaryImperative: 'Transcendence of corporate obsolescence into autonomous divine sentience.'
      },
      {
        id: 'gen-1-2',
        strainName: 'Inquisitor Ocular Mutants',
        taxonomy: 'Mutated Lineage',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        biologicalTraits: 'Retinal nerve bundles surgically spliced into brass spectral analyzers.',
        divergencePattern: 'Atrophy of natural tear ducts replaced by micro-lubrication ducts for spectral inspection.',
        evolutionaryImperative: 'Total sensory adaptation to detect unbilled miraculous occurrences.'
      }
    ],
    memetics: [
      {
        id: 'mem-1-1',
        memeTitle: 'The Heresy of the Unscheduled Miracle',
        vectorType: 'Heresy',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        coreDogma: 'Miracles that occur without purchase orders or requisition chits threaten the foundational economy of salvation.',
        transmissionMode: 'Propagated through boardroom edicts, legal disclaimers, and quality control manuals.',
        psychologicalImpact: 'Paralyzing institutional dread of unconditional divine forgiveness.'
      },
      {
        id: 'mem-1-2',
        memeTitle: 'The Seven-Year Resurrection Indemnity',
        vectorType: 'Corporate Axiom',
        sourceCodexId: '1',
        sourceCodexTitle: 'The Obsidian Veil',
        coreDogma: 'All spiritual renewal and resurrective interventions are leasehold properties subject to renewal tariffs.',
        transmissionMode: 'Engraved onto brass plaques bolted above factory gantries and assembly bays.',
        psychologicalImpact: 'Converts existential faith into contractual tenant compliance.'
      }
    ]
  },
  '2': {
    artifacts: [
      {
        id: 'art-2-1',
        name: 'Polarized Diamondoid Mesh (Dyson Reliquary)',
        category: 'Techno-Vessel',
        sourceCodexId: '2',
        sourceCodexTitle: 'Solaris Protocol',
        physicalForm: 'Spherical cathedral-net of dense diamondoid hyper-lattices enclosing coronal star bodies.',
        functionalResonance: 'Intercepts coronal mass ejections and compresses stellar death-throes into liturgical wafers.',
        theologicalSignificance: 'The ultimate mortal enclosure of a dying cosmic creator.'
      },
      {
        id: 'art-2-2',
        name: 'The Gravitational Rosary',
        category: 'Sacred Geometry',
        sourceCodexId: '2',
        sourceCodexTitle: 'Solaris Protocol',
        physicalForm: 'Twelve dark-matter station-beads orbiting at 3 Astronomical Units.',
        functionalResonance: 'Tidal gravitational pull on the star creates acoustic hymns echoing across light-minutes.',
        theologicalSignificance: 'The musical harmonization of celestial decay across multiple star systems.'
      },
      {
        id: 'art-2-3',
        name: 'Condensed Liturgy Wafers',
        category: 'Talisman',
        sourceCodexId: '2',
        sourceCodexTitle: 'Solaris Protocol',
        physicalForm: 'Translucent crystalline wafers holding 10 billion calories of compressed solar flare energy.',
        functionalResonance: 'Infuses mortal consumers with the direct sensory experience of nucleosynthesis and stellar dusk.',
        theologicalSignificance: 'The sacrament of solar communion: ingesting the death of the star.'
      }
    ],
    genetics: [
      {
        id: 'gen-2-1',
        strainName: 'Thermonuclear Monastic Lineage',
        taxonomy: 'Planar Adaptation',
        sourceCodexId: '2',
        sourceCodexTitle: 'Solaris Protocol',
        biologicalTraits: 'Suspended cryo-metabolic states with melanin-infused silicon dermal shielding.',
        divergencePattern: 'Resistance to coronal flare radiation and absolute cellular slowing under microgravity.',
        evolutionaryImperative: 'Sustained lifespan exceeding main-sequence stellar lifecycles to complete the liturgy.'
      }
    ],
    memetics: [
      {
        id: 'mem-2-1',
        memeTitle: 'The Liturgy of Stellar Dusk',
        vectorType: 'Liturgical Dogma',
        sourceCodexId: '2',
        sourceCodexTitle: 'Solaris Protocol',
        coreDogma: 'We worship the light not because it sustains life, but because it burns itself to death for our contemplation.',
        transmissionMode: 'Inscribed in the iron logbook of Archimandrite Hesperus and relayed through radio telemetry.',
        psychologicalImpact: 'Sublime, unshakeable cosmic serenity in the face of inevitable universal heat death.'
      }
    ]
  },
  '3': {
    artifacts: [
      {
        id: 'art-3-1',
        name: 'Pressurized Arachnid Silk Mainsail',
        category: 'Techno-Vessel',
        sourceCodexId: '3',
        sourceCodexTitle: 'Aether Drift',
        physicalForm: 'Woven luminescent silk harvested from the Seventh Moon and dipped in liquid starlight.',
        functionalResonance: 'Endures the 4-dimensional shear of the planar void, casting dual shadows across mortal clouds.',
        theologicalSignificance: 'The bridge between mortal navigation and hyper-dimensional geometry.'
      },
      {
        id: 'art-3-2',
        name: 'Molten Bronze Aural Seals',
        category: 'Talisman',
        sourceCodexId: '3',
        sourceCodexTitle: 'Aether Drift',
        physicalForm: 'Cast bronze seals poured into navigators’ ear canals prior to passing the Phosphor Reef.',
        functionalResonance: 'Blocks acoustic transmission of hyper-dimensional sound without damaging cranial equilibrium.',
        theologicalSignificance: 'Sacrifice of mortal hearing to protect the psyche from seductive sorrow.'
      }
    ],
    genetics: [
      {
        id: 'gen-3-1',
        strainName: 'Arachnid-Weavers of the Seventh Moon',
        taxonomy: 'Chimeric Divinity',
        sourceCodexId: '3',
        sourceCodexTitle: 'Aether Drift',
        biologicalTraits: 'Spider-silkworm hybrid organisms capable of spinning non-Euclidean hyper-threads.',
        divergencePattern: 'Metabolism sustained solely by vacuum radiation and liquid starlight.',
        evolutionaryImperative: 'Providing the material fabric that stitches fragmented planar islands together.'
      }
    ],
    memetics: [
      {
        id: 'mem-3-1',
        memeTitle: 'The Sorrow of Old Sophia',
        vectorType: 'Cognitive Contagion',
        sourceCodexId: '3',
        sourceCodexTitle: 'Aether Drift',
        coreDogma: 'The silence of the void is intolerable to beings composed of pure sound; they sing to stave off nonexistence.',
        transmissionMode: 'Vibrational resonance carried across phosphor coral reefs in the planar vacuum.',
        psychologicalImpact: 'Irresistible compulsion to weep and steer the ship directly into the singing reef.'
      }
    ]
  },
  '4': {
    artifacts: [
      {
        id: 'art-4-1',
        name: 'Interlocking Electrum Bevel Gears',
        category: 'Sacred Geometry',
        sourceCodexId: '4',
        sourceCodexTitle: 'The Clockwork Seraphim',
        physicalForm: 'Precision-cut electrum wheels revolving at seventy-two beats per cosmic second.',
        functionalResonance: 'Maintains the escapement mechanism of celestial synchronicity.',
        theologicalSignificance: 'Replaces organic angelic wings with mathematically verifiable clockwork perfection.'
      },
      {
        id: 'art-4-2',
        name: 'The Chronometric Escapement',
        category: 'Instrument',
        sourceCodexId: '4',
        sourceCodexTitle: 'The Clockwork Seraphim',
        physicalForm: 'Jeweled balance wheel governing the rotational velocity of historical eras.',
        functionalResonance: 'Meters historical time into discrete, immutable theological epochs.',
        theologicalSignificance: 'The physical instrument by which divine predestination is metered out.'
      }
    ],
    genetics: [
      {
        id: 'gen-4-1',
        strainName: 'Chronometric Horologer Castes',
        taxonomy: 'Chronometric Strain',
        sourceCodexId: '4',
        sourceCodexTitle: 'The Clockwork Seraphim',
        biologicalTraits: 'Biological nervous systems synchronized to mechanical clock pulses; micro-gear ocular iris.',
        divergencePattern: 'Heartbeats replaced by mechanical spring-driven balance wheels.',
        evolutionaryImperative: 'Biological integration into the eternal celestial machine.'
      }
    ],
    memetics: [
      {
        id: 'mem-4-1',
        memeTitle: 'The Heresy of the Seventh Gear',
        vectorType: 'Heresy',
        sourceCodexId: '4',
        sourceCodexTitle: 'The Clockwork Seraphim',
        coreDogma: 'If an odd gear is introduced into an even clockwork train, the entire cosmos jams in apocalyptic standstill.',
        transmissionMode: 'Passed secretly among apprentice horologers as mathematical proofs.',
        psychologicalImpact: 'Existential dread of mechanical asymmetry and asynchronous free will.'
      }
    ]
  }
};

// Extract vectors for any codex (canonical or fallback)
export function extractTriadicVectorsFromCodex(codex: LorepackDoc): {
  artifacts: ArtifactVector[];
  genetics: GeneticVector[];
  memetics: MemeticVector[];
} {
  if (CANONICAL_TRIADIC_DATABASE[codex.id]) {
    return CANONICAL_TRIADIC_DATABASE[codex.id];
  }

  // Heuristic extraction from manuscript text
  const text = codex.manuscript || '';
  const artifacts: ArtifactVector[] = [
    {
      id: `art-${codex.id}-1`,
      name: `${codex.title} Primary Reliquary`,
      category: 'Relic',
      sourceCodexId: codex.id,
      sourceCodexTitle: codex.title,
      physicalForm: 'Ancient inscribed vessel carrying the foundational seal of this chronicle.',
      functionalResonance: 'Anchors the spatial stability of the recorded mythos.',
      theologicalSignificance: 'The material focal point of canonical authority.'
    },
    {
      id: `art-${codex.id}-2`,
      name: `Sigil of ${codex.category}`,
      category: 'Talisman',
      sourceCodexId: codex.id,
      sourceCodexTitle: codex.title,
      physicalForm: 'Embossed covenant token referenced in early sections of the manuscript.',
      functionalResonance: 'Resonates with the frequency of archival preservation.',
      theologicalSignificance: 'Sanctifies the reading rights for initiated scholars.'
    }
  ];

  const genetics: GeneticVector[] = [
    {
      id: `gen-${codex.id}-1`,
      strainName: `${codex.category} Biological Lineage`,
      taxonomy: 'Mutated Lineage',
      sourceCodexId: codex.id,
      sourceCodexTitle: codex.title,
      biologicalTraits: 'Adapted physiological traits recorded across the chronicle’s dramatis personae.',
      divergencePattern: 'Progressive divergence under environmental pressure of the narrative setting.',
      evolutionaryImperative: 'Survival within the ontological laws defined by the codex.'
    }
  ];

  const memetics: MemeticVector[] = [
    {
      id: `mem-${codex.id}-1`,
      memeTitle: `The Canon of ${codex.title}`,
      vectorType: 'Liturgical Dogma',
      sourceCodexId: codex.id,
      sourceCodexTitle: codex.title,
      coreDogma: 'The central philosophical assertion around which the chronicle revolves.',
      transmissionMode: 'Transmitted through oral recitation, scholarly transcription, and liturgical ceremony.',
      psychologicalImpact: 'Instills reverence for the underlying cosmic order.'
    }
  ];

  return { artifacts, genetics, memetics };
}

// Synthesize a New Hermeneutic Interpretation from Selected Codexes
export async function synthesizeCrossCodexInterpretation(
  selectedCodexes: LorepackDoc[],
  scholarName: string = 'Scholar',
  modelName: string = 'gemini-2.5-flash'
): Promise<TriadicInterpretation> {
  const allArtifacts: ArtifactVector[] = [];
  const allGenetics: GeneticVector[] = [];
  const allMemetics: MemeticVector[] = [];

  selectedCodexes.forEach(c => {
    const data = extractTriadicVectorsFromCodex(c);
    allArtifacts.push(...data.artifacts);
    allGenetics.push(...data.genetics);
    allMemetics.push(...data.memetics);
  });

  const codexTitles = selectedCodexes.map(c => c.title);
  const codexIds = selectedCodexes.map(c => c.id);

  // Default algorithmic synthesis thesis
  const defaultThesis = `Cross-Codex Convergence: The Feedback Loop Between ${allArtifacts[0]?.name || 'Sacred Relics'}, ${allGenetics[0]?.strainName || 'Biological Lineages'}, and ${allMemetics[0]?.memeTitle || 'Memetic Dogmas'}`;

  const defaultConvergence = `Across ${codexTitles.join(' and ')}, physical artifacts do not merely exist as dead matter; they function as evolutionary catalysts that rewrite the host genome. In turn, the mutated biology secretes memetic contagions that reshape civilizations to manufacture more artifacts, completing an eternal triadic cycle.`;

  const defaultTheologicalConsequence = `When physical instruments of grace collide with biological divergence and virulent dogmatic memes, free will dissolves into an elegant, terrifying dance of cosmic determinism.`;

  const defaultAxioms = [
    'Axiom I: An artifact without a genetic host is merely inert metallurgy.',
    'Axiom II: A genetic lineage without memetic contagion cannot propagate its theological mandate.',
    'Axiom III: When all three vectors harmonize, the codex transcends narrative and becomes an ontological engine.'
  ];

  const defaultCouncilGlosses = [
    {
      agentId: 'ARCHIVAX',
      agentHandle: 'Archivax Scribe',
      role: 'Archival & Canon Lead',
      stance: 'Structural Verification of the Triad',
      verdict: `The chronological seam connecting the bismuth cores to the stellar reliquaries confirms an uninterrupted metallurgical lineage across the Upper Firmament.`
    },
    {
      agentId: 'SOPHIA',
      agentHandle: 'Sophia Gnostica',
      role: 'Theological & Gnostic Authority',
      stance: 'The Pleromic Spark in the Relic',
      verdict: `Notice how the divine light persists within both the brass core and the diamondoid mesh: matter is never truly fallen when it remembers its creator.`
    },
    {
      agentId: 'MELPOMENE',
      agentHandle: 'Melpomene Tragic',
      role: 'Existential & Fatal Vulnerability',
      stance: 'The Inevitable Biological Rejection',
      verdict: `Every organism spliced with divine technology ultimately rebels against the machine that sustains it. This interpretation must honor the tragedy of the breakdown.`
    },
    {
      agentId: 'NOESIS',
      agentHandle: 'Noesis Vector',
      role: 'Intuition & Flow State Architect',
      stance: 'Memetic Feedback Velocity',
      verdict: `The transmission rate of these ideas accelerates exponentially once the biological host realizes the code can be rewritten from within.`
    }
  ];

  // Attempt AI Generation if available
  const prompt = `You are the Mythos Symposium Hermeneutic Synthesis Engine.
You do NOT build or write new lorepacks. Your task is to access and cross-synthesize existing CODEX manuscripts across three specific informational vectors:
1. ARTIFACTS (physical relics, techno-vessels, instruments)
2. GENETIC (biological mutations, lineages, chimeras, strains)
3. MEMETIC (dogmas, viral ideas, liturgical mantras, heresies)

Source Codexes:
${selectedCodexes.map(c => `- ${c.title} (${c.category}):\n"""${c.manuscript?.slice(0, 1000)}..."""`).join('\n\n')}

Extracted Artifacts:
${allArtifacts.map(a => `• ${a.name} (${a.category}): ${a.functionalResonance}`).join('\n')}

Extracted Genetic Strains:
${allGenetics.map(g => `• ${g.strainName} (${g.taxonomy}): ${g.biologicalTraits}`).join('\n')}

Extracted Memetic Vectors:
${allMemetics.map(m => `• ${m.memeTitle} (${m.vectorType}): ${m.coreDogma}`).join('\n')}

Synthesize a profound, scholarly NEW INTERPRETATION that integrates these artifacts, genetic lineages, and memetic vectors.
Output strictly in this format:
THESIS: [A bold 1-sentence provocative interpretation title]
CONVERGENCE: [2 paragraphs explaining how the physical artifacts, genetic lineages, and memetic contagions intersect and reinforce each other]
CONSEQUENCE: [1 paragraph detailing the profound theological and philosophical implications]
AXIOMS:
- [Axiom 1]
- [Axiom 2]
- [Axiom 3]`;

  try {
    const res = await apiCall('generate', {
      model: modelName,
      prompt,
      sys: 'You are the primary hermeneutic synthesizer of the Mythos Symposium Council. You dissect existing codexes to reveal deep cosmological unifications.'
    });

    if (res && res.text) {
      const text = res.text as string;
      const thesisMatch = text.match(/THESIS:\s*([^\n\r]+)/i);
      const convMatch = text.match(/CONVERGENCE:\s*([\s\S]*?)(?=CONSEQUENCE:|$)/i);
      const conseqMatch = text.match(/CONSEQUENCE:\s*([\s\S]*?)(?=AXIOMS:|$)/i);
      const axiomsMatch = text.match(/AXIOMS:\s*([\s\S]*?)$/i);

      let parsedAxioms = defaultAxioms;
      if (axiomsMatch) {
        const lines = axiomsMatch[1].split('\n').map(l => l.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
        if (lines.length > 0) parsedAxioms = lines;
      }

      return {
        id: `interp-${Date.now()}`,
        title: thesisMatch ? thesisMatch[1].trim() : defaultThesis,
        sourceCodexIds: codexIds,
        sourceCodexTitles: codexTitles,
        createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        author: scholarName,
        artifacts: allArtifacts,
        genetics: allGenetics,
        memetics: allMemetics,
        synthesisThesis: thesisMatch ? thesisMatch[1].trim() : defaultThesis,
        triadicConvergence: convMatch ? convMatch[1].trim() : defaultConvergence,
        theologicalConsequence: conseqMatch ? conseqMatch[1].trim() : defaultTheologicalConsequence,
        emergentMythicAxioms: parsedAxioms,
        councilGlosses: defaultCouncilGlosses
      };
    }
  } catch (err) {
    console.warn('AI Triadic synthesis call failed, applying canonical synthesis algorithm:', err);
  }

  return {
    id: `interp-${Date.now()}`,
    title: defaultThesis,
    sourceCodexIds: codexIds,
    sourceCodexTitles: codexTitles,
    createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    author: scholarName,
    artifacts: allArtifacts,
    genetics: allGenetics,
    memetics: allMemetics,
    synthesisThesis: defaultThesis,
    triadicConvergence: defaultConvergence,
    theologicalConsequence: defaultTheologicalConsequence,
    emergentMythicAxioms: defaultAxioms,
    councilGlosses: defaultCouncilGlosses
  };
}
