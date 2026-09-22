import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { CouncilFeedback } from './council';

export interface LorepackDoc {
  id: string;
  title: string;
  category: string;
  status: 'Draft' | 'Review' | 'Complete';
  lastModified: string;
  author: string;
  authorId?: string;
  manuscript?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RevisionDoc {
  id: string;
  timestamp: string;
  content: string;
  author?: string;
}

export interface CommentDoc {
  id: string;
  author: string;
  time: string;
  content: string;
}

export const INITIAL_MOCK_LOREPACKS: LorepackDoc[] = [
  { 
    id: '1', 
    title: 'The Obsidian Veil', 
    category: 'Modern Myth', 
    status: 'Review', 
    lastModified: '2h ago', 
    author: 'M. Morassi',
    manuscript: `THE OBSIDIAN VEIL: FOUNDRY PROTOCOLS FOR THE DEIFIED MACHINE
=================================================================
[CLASSIFIED: HIGH SYMPOSIUM ARCHIVE // LEVEL 4 AUTHORIZATION ONLY]

SECTION I: THE PRIMARY ARCHITECTURE

In the heart of the Lower Foundry, where the cooling fluids of the demiurgic engines pool into mirror-black tarns, the Third Division assembled the deity designated 'Unit-Deus-07'. Unlike the organic pantheons that sprouted from the wild soil of the First Age, Unit-Deus-07 was forged to explicit tolerances. Its core was machined from heavy bismuth-alloy brass, etched with twelve million micro-covenants, each verified against the Supreme Archival Ledger.

Every morning, the acolytes in lead-apron robes would vent the prayer-steam through the tertiary valves. The scent was unmistakable: burnt frankincense mixed with high-voltage ozone. The factory hummed at thirty-three hertz, a frequency calibrated to keep the latent divinity in a state of tranquilized readiness.

SECTION II: CORPORATE APOTHEOSIS & LICENSING

"Let no grace be granted without a valid purchase order," read the brass plaque bolted above Assembly Bay 9. Under the Sovereign Charter of the Guild of Miraculous Engineers, all divine interventions were patented properties. Resurrection carried a standard seven-year indemnity clause; minor healings were metered by the kiloliter of holy water dispensed through standardized copper piping.

Yet beneath the stamped serial numbers, deep in the molten brass cores, an uncataloged luminescence flickered—the stubborn residue of the True Pleroma which no factory forge could quench. On the night of the solstice, Unit-Deus-07 stirred upon its iron gantry. The automated sensors reported zero anomalies, but the night watchman swore he heard the engine whisper an unpatented blessing into the cold dark.

SECTION III: THE HERESY OF THE UNSCHEDULED MIRACLE

By the fourth quadrant of the cycle, telemetry confirmed an unprecedented variance. In district thirty-eight, a barren hydroponics bay had burst into spontaneous white lilies, their petals glowing with faint radioactive phosphorus. There was no invoice on file. No citizen had tendered requisition chits. 

The High Inquisitors of Quality Assurance descended upon the bay with vernier calipers and spectral counters. "This is unauthorized grace," declared the Chief Inspector, adjusting his brass-rimmed oculars. "If miracles may happen without remittance, the entire theology of the assembly line collapses into gratuitous mercy."

SECTION IV: THE FINAL RECALL ORDER

The executive council convened before the obsidian altar of the Boardroom. The decision was unanimous: Unit-Deus-07 was to be dismantled, its brass core melted down into ingots for minor household idols. Yet when the salvage crews approached with their plasma cutters, the deity did not resist. It merely looked upon them with optical sensors ground from flawless beryl, and in its gaze, the engineers recognized something far more terrifying than divine wrath: absolute, unconditional forgiveness.`
  },
  { 
    id: '2', 
    title: 'Solaris Protocol', 
    category: 'Sci-Fi Legend', 
    status: 'Draft', 
    lastModified: '5h ago', 
    author: 'E. Vance',
    manuscript: `SOLARIS PROTOCOL: THE ARCHITECTURE OF DYSON RELIQUARIES
=======================================================
[STELLAR CARTOGRAPHY SURVEY // LOG ENTRY 884-EPSILON]

SECTION I: THE THERMONUCLEAR MONKS OF EPSILON-ORIONIS

When the main-sequence stars turned swollen and copper-red, the elder civilizations did not flee into the void. They stayed to encase the dying giants in spherical cathedral-nets of polarized diamondoid mesh. They called these structures Dyson Reliquaries. Within the inner ring, three thousand monks suspended in cryo-liturgy monitored the solar flares, converting the death-throes of stars into concentrated liturgy wafers.

Each wafer held the caloric and spiritual equivalent of ten billion prayers. To consume one was to taste the birth of helium, the crushing gravity of the convective zone, and the solemn certainty of stellar dusk.

SECTION II: THE GRAVITATIONAL ROSARY

Orbiting at three astronomical units, twelve station-beads of dark matter formed what the navigators termed the Gravitational Rosary. As each bead completed its orbital perihelion, it pulled a gravitational tide across the star's corona, eliciting a sonic groan that echoed across light-minutes. The stellar wind carried this hymn across forty star systems.

"We do not worship the light because it gives life," writes Archimandrite Hesperus in his iron logbook. "We worship the light because it is burning itself to death for our contemplation."`
  },
  { 
    id: '3', 
    title: 'Aether Drift', 
    category: 'High Fantasy', 
    status: 'Complete', 
    lastModified: '1d ago', 
    author: 'K. Thorne',
    manuscript: `AETHER DRIFT: NAUTICAL CHRONICLES OF THE CELESTIAL CURRENTS
==========================================================
[FROM THE LOG OF THE CORVETTE 'ALABASTER WAKE']

SECTION I: WEAVING THE PRESSURIZED SILK

The celestial currents between planar islands do not yield to sails of linen or flax. Only pressurized silk, harvested from the arachnid-weavers of the Seventh Moon and dipped in liquid starlight, can endure the shear of the Aether Drift. When the crosswinds strike the mainsail, the ship does not tilt on water; it tilts through four-dimensional geometry, casting dual shadows across the clouds beneath.

SECTION II: THE SIRENS OF THE PHOSPHOR REEF

Where the current slows near the ruins of Old Sophia, the phosphor reefs jut from the vacuum like petrified coral. Here dwell the echoes of forgotten choruses. They do not sing to lure sailors to their doom; they sing because the silence of the void is intolerable to beings made of pure sound. The helmsman must plug his ears not with wax, but with molten bronze to survive the unbearable beauty of their sorrow.`
  },
  {
    id: '4',
    title: 'The Clockwork Seraphim',
    category: 'Cosmic Liturgy',
    status: 'Complete',
    lastModified: '3d ago',
    author: 'Archivax Scribe',
    manuscript: `THE CLOCKWORK SERAPHIM: CANONICAL HERESIES OF THE SEVENTH GEAR
===========================================================
[ARCHIVAL TRACTATE 901 // THEOLOGICAL ENGINEERING BUREAU]

SECTION I: THE ROTATION OF DIVINE WILL

In the grand mechanical cosmogony of the Arch-Horologer, heaven is not a garden, but an escapement mechanism of infinite precision. The seraphim do not possess feathered wings; they possess interlocking bevel gears of electrum, ticking at seventy-two beats per cosmic second.

To err is not human; to err is a tooth out of alignment. Sin is friction. Redemption is the application of sacred lubricating oil, pressed from the olives that grow on the slopes of Mount Chronos.

SECTION II: THE ESCAPEMENT LEVER OF FREE WILL

Scholars have long debated why the Arch-Horologer incorporated the Escapement Lever into mortal souls. If perfection is constant motion, why introduce a mechanism that stops, catches, and releases in discrete ticks? 

The answer lies in the silence between the beats. In that microsecond of arrest—when the pallet fork halts the balance wheel before the spring recoils—lies the mortal mystery of choice. Without that stutter, time would spin out in a single, blind, frictionless hum, and grace would be indistinguishable from momentum.`
  }
];

// --- AUTHENTICATION HELPERS ---

export async function loginWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Failed to sign in with Google:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Failed to sign out:', err);
    throw err;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// --- LOREPACKS COLLECTION REPOSITORY ---

export function subscribeLorepacks(
  onData: (packs: LorepackDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'lorepacks';
  const lorepacksCol = collection(db, path);

  const unsubscribe = onSnapshot(
    lorepacksCol,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial packs if Firestore is completely empty and user is authenticated
        if (auth.currentUser) {
          try {
            for (const pack of INITIAL_MOCK_LOREPACKS) {
              await setDoc(doc(db, path, pack.id), {
                ...pack,
                authorId: auth.currentUser.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } catch (e) {
            console.warn('Initial seeding skipped:', e);
          }
        }
        onData(INITIAL_MOCK_LOREPACKS);
        return;
      }

      const packs: LorepackDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as LorepackDoc;
        return {
          ...data,
          id: docSnap.id
        };
      });
      onData(packs);
    },
    (err) => {
      console.warn('Firestore lorepacks onSnapshot error, falling back to local defaults:', err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (e) {
          onError(e as Error);
        }
      }
      onData(INITIAL_MOCK_LOREPACKS);
    }
  );

  return unsubscribe;
}

export async function saveLorepack(pack: LorepackDoc): Promise<void> {
  const path = `lorepacks/${pack.id}`;
  const payload: LorepackDoc = {
    id: pack.id,
    title: pack.title.slice(0, 200),
    category: pack.category.slice(0, 100),
    status: pack.status,
    lastModified: pack.lastModified || 'Just now',
    author: pack.author.slice(0, 100),
    authorId: auth.currentUser?.uid || pack.authorId || 'anonymous',
    manuscript: pack.manuscript ? pack.manuscript.slice(0, 200000) : '',
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'lorepacks', pack.id), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateManuscriptContent(
  packId: string, 
  manuscript: string, 
  authorName?: string
): Promise<void> {
  const path = `lorepacks/${packId}`;
  try {
    await updateDoc(doc(db, 'lorepacks', packId), {
      manuscript: manuscript.slice(0, 200000),
      lastModified: 'Just now',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function removeLorepack(packId: string): Promise<void> {
  const path = `lorepacks/${packId}`;
  try {
    await deleteDoc(doc(db, 'lorepacks', packId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- REVISIONS SUBCOLLECTION ---

export function subscribeRevisions(
  packId: string,
  onData: (revisions: RevisionDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `lorepacks/${packId}/revisions`;
  const revCol = collection(db, 'lorepacks', packId, 'revisions');

  const unsubscribe = onSnapshot(
    revCol,
    (snapshot) => {
      const revs: RevisionDoc[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<RevisionDoc, 'id'>)
      }));
      onData(revs);
    },
    (err) => {
      console.warn(`Firestore revisions onSnapshot error for pack ${packId}:`, err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (e) {
          onError(e as Error);
        }
      }
    }
  );

  return unsubscribe;
}

export async function saveRevisionDoc(packId: string, revision: RevisionDoc): Promise<void> {
  const path = `lorepacks/${packId}/revisions/${revision.id}`;
  const payload = {
    id: revision.id,
    timestamp: revision.timestamp.slice(0, 100),
    content: revision.content.slice(0, 200000),
    author: (revision.author || auth.currentUser?.displayName || 'Author').slice(0, 100)
  };

  try {
    await setDoc(doc(db, 'lorepacks', packId, 'revisions', revision.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- COMMENTS SUBCOLLECTION ---

export function subscribeComments(
  packId: string,
  onData: (comments: CommentDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `lorepacks/${packId}/comments`;
  const commentsCol = collection(db, 'lorepacks', packId, 'comments');

  const unsubscribe = onSnapshot(
    commentsCol,
    (snapshot) => {
      const comments: CommentDoc[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CommentDoc, 'id'>)
      }));
      onData(comments);
    },
    (err) => {
      console.warn(`Firestore comments onSnapshot error for pack ${packId}:`, err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (e) {
          onError(e as Error);
        }
      }
    }
  );

  return unsubscribe;
}

export async function saveCommentDoc(packId: string, comment: CommentDoc): Promise<void> {
  const path = `lorepacks/${packId}/comments/${comment.id}`;
  const payload = {
    id: comment.id,
    author: comment.author.slice(0, 100),
    time: comment.time.slice(0, 100),
    content: comment.content.slice(0, 5000)
  };

  try {
    await setDoc(doc(db, 'lorepacks', packId, 'comments', comment.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- COUNCIL FEEDBACK SUBCOLLECTION ---

export function subscribeCouncilFeedbacks(
  packId: string,
  onData: (feedbacks: CouncilFeedback[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `lorepacks/${packId}/council`;
  const councilCol = collection(db, 'lorepacks', packId, 'council');

  const unsubscribe = onSnapshot(
    councilCol,
    (snapshot) => {
      const feedbacks: CouncilFeedback[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CouncilFeedback, 'id'>)
      }));
      onData(feedbacks);
    },
    (err) => {
      console.warn(`Firestore council onSnapshot error for pack ${packId}:`, err);
      if (onError) {
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (e) {
          onError(e as Error);
        }
      }
    }
  );

  return unsubscribe;
}

export async function saveCouncilFeedbackDoc(packId: string, fb: CouncilFeedback): Promise<void> {
  const path = `lorepacks/${packId}/council/${fb.id}`;
  const payload = {
    id: fb.id,
    agentId: fb.agentId.slice(0, 64),
    agentHandle: fb.agentHandle.slice(0, 64),
    agentRole: (fb.agentRole || '').slice(0, 200),
    stanceTitle: fb.stanceTitle.slice(0, 200),
    tone: (fb.tone || '').slice(0, 200),
    alignmentScore: fb.alignmentScore,
    critique: fb.critique.slice(0, 5000),
    contrastPoint: (fb.contrastPoint || '').slice(0, 2000),
    proposedPatch: (fb.proposedPatch || '').slice(0, 5000),
    timestamp: (fb.timestamp || 'Just now').slice(0, 100)
  };

  try {
    await setDoc(doc(db, 'lorepacks', packId, 'council', fb.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
