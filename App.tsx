import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

type Node = { p: THREE.Vector3; parent: number; depth: number };
function NeuralNetwork({ energy, awakened }: { energy: number; awakened: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { points, lines } = useMemo(() => {
    const nodes: Node[] = [{ p: new THREE.Vector3(0, 0, 0), parent: -1, depth: 0 }];
    let frontier = [0];
    for (let depth = 1; depth <= 5; depth++) {
      const next: number[] = [];
      frontier.forEach((parent, branch) => {
        const count = depth < 3 ? 3 : 2;
        for (let j = 0; j < count; j++) {
          const a = (j / count) * Math.PI * 2 + depth * 0.73 + branch * 0.29;
          const prev = nodes[parent].p;
          const spread = 0.72 + depth * 0.2;
          const p = new THREE.Vector3(
            prev.x + Math.cos(a) * spread + (Math.random() - .5) * .22,
            prev.y + Math.sin(a) * spread * .72 + (Math.random() - .5) * .2,
            prev.z + (Math.random() - .5) * .95
          );
          nodes.push({ p, parent, depth });
          next.push(nodes.length - 1);
        }
      });
      frontier = next;
    }
    const pos: number[] = [], linePos: number[] = [];
    nodes.forEach((n, i) => {
      pos.push(n.p.x, n.p.y, n.p.z);
      if (n.parent >= 0) {
        const p = nodes[n.parent].p;
        linePos.push(p.x,p.y,p.z,n.p.x,n.p.y,n.p.z);
      }
    });
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pos,3));
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(linePos,3));
    return { points: pg, lines: lg };
  }, []);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * .12) * .12;
      group.current.rotation.z = Math.sin(clock.elapsedTime * .16) * .035;
      const target = awakened ? 1.0 : .74;
      group.current.scale.lerp(new THREE.Vector3(target,target,target), .025);
    }
  });
  return <group ref={group} scale={.74}>
    <points geometry={points}>
      <pointsMaterial color={awakened ? "#b9a4ff" : "#7580b8"} size={.035 + energy*.012} sizeAttenuation transparent opacity={.92} blending={THREE.AdditiveBlending} />
    </points>
    <lineSegments geometry={lines}>
      <lineBasicMaterial color={awakened ? "#a68cff" : "#4d5a9d"} transparent opacity={.42 + energy*.15} blending={THREE.AdditiveBlending}/>
    </lineSegments>
    <mesh>
      <icosahedronGeometry args={[.22,3]}/>
      <meshBasicMaterial color={awakened ? "#e4d9ff" : "#9b9ce8"} wireframe transparent opacity={.65}/>
    </mesh>
  </group>;
}

function CosmicGenesis({ chapter }: { chapter: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { geometry, directions, distances, colors } = useMemo(() => {
    const count = 3200;
    const positions = new Float32Array(count * 3);
    const dirs = new Float32Array(count * 3);
    const dist = new Float32Array(count);
    const cols = new Float32Array(count * 3);
    const palette = [new THREE.Color("#fff4dc"), new THREE.Color("#a8b8ff"), new THREE.Color("#c5a0ff"), new THREE.Color("#70d9e6")];
    for (let i = 0; i < count; i++) {
      const z = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      dirs[i * 3] = r * Math.cos(a);
      dirs[i * 3 + 1] = z;
      dirs[i * 3 + 2] = r * Math.sin(a);
      dist[i] = 2.5 + Math.pow(Math.random(), .65) * 24;
      const c = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return { geometry: g, directions: dirs, distances: dist, colors: cols };
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const phase = THREE.MathUtils.clamp((chapter + 1) / 6, 0, 1);
    const expansion = chapter === 0 ? .12 + Math.min(t * .38, 2.65) : 2.8 + (chapter - 1) * .62;
    const attr = geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < distances.length; i++) {
      const drift = 1 + Math.sin(t * .42 + i * .017) * .012;
      const radius = distances[i] * expansion * drift;
      arr[i * 3] = directions[i * 3] * radius;
      arr[i * 3 + 1] = directions[i * 3 + 1] * radius;
      arr[i * 3 + 2] = directions[i * 3 + 2] * radius;
    }
    attr.needsUpdate = true;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * .012;
      pointsRef.current.rotation.z = Math.sin(t * .08) * .025;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.4) * .08;
      const scale = chapter === 0 ? Math.max(.08, .72 - Math.min(t, 8) * .08) * pulse : Math.max(.025, .16 * (1 - phase * 1.3)) * pulse;
      coreRef.current.scale.setScalar(scale);
      coreRef.current.visible = chapter < 4;
    }
    if (ringRef.current) {
      const ringScale = chapter === 0 ? 1.15 + Math.min(t * .8, 5.5) : .4 + phase * 7.5;
      ringRef.current.scale.setScalar(ringScale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = chapter === 0 ? .82 : Math.max(0, .42 - phase * .35);
      ringRef.current.visible = chapter < 5;
    }
  });
  return <>
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial vertexColors size={.045} sizeAttenuation transparent opacity={.94} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
    <mesh ref={coreRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#fff3d7" />
    </mesh>
    <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[1, .012, 8, 180]} />
      <meshBasicMaterial color="#b6a2ff" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
    <pointLight position={[0, 0, 0]} color="#a88cff" intensity={chapter < 1 ? 18 : 2.2} distance={18} />
  </>;
}

function Scene({ energy, awakened, chapter }: { energy: number; awakened: boolean; chapter: number }) {
  return <>
    <color attach="background" args={["#05050b"]}/>
    <fog attach="fog" args={["#05050b", 8, 25]}/>
    <ambientLight intensity={.5}/>
    <pointLight position={[4,3,5]} color="#8d69ff" intensity={3}/>
    <pointLight position={[-4,-2,-4]} color="#42c9db" intensity={2}/>
    <Stars radius={100} depth={55} count={3200} factor={3.4} saturation={.35} fade speed={.22}/>
    <CosmicGenesis chapter={chapter}/>
    {chapter >= 4 && <Float speed={.42} rotationIntensity={.16} floatIntensity={.28}>
      <NeuralNetwork energy={energy} awakened={awakened}/>
    </Float>}
  </>;
}
const chapters = [
  { n:"01", title:"And then, space began", kicker:"THE BIG BANG", copy:"Before stars, before planets, before anyone could look up, the universe was an extraordinarily hot, dense place. Then space itself began expanding. Not an explosion into darkness. The beginning of the darkness, the light, and everything that would ever have a place to exist." },
  { n:"02", title:"Light found its way through", kicker:"THE FIRST LIGHT", copy:"The universe cooled. Particles formed, atoms followed, and light eventually travelled freely across space. Gravity gathered matter into the first stars and galaxies. The darkness was learning how to shine." },
  { n:"03", title:"The stars made the ingredients", kicker:"STARS · ELEMENTS · WORLDS", copy:"Inside stars, simple elements were transformed into the ingredients of planets and living things. When stars died, they scattered those elements into space. Later, around new stars, worlds began to gather." },
  { n:"04", title:"One world became alive", kicker:"THE LONG EXPERIMENT", copy:"On a small planet orbiting an ordinary star, chemistry became biology. Life changed, adapted, and diversified. Eventually, some organisms developed nervous systems: living networks that could sense, learn, remember, and dream." },
  { n:"05", title:"Matter learned to wonder", kicker:"BRAINS · QUESTIONS · IDEAS", copy:"After billions of years, matter had become capable of asking where it came from. A brain could build models of the universe, imagine things that did not yet exist, and wonder about the strange experience of being alive." },
  { n:"06", title:"A girl named Angelic", kicker:"THE VISION", copy:"And somewhere on that small blue world, a girl named Angelic looked at all these questions and decided she wanted to follow them. She wanted to understand brains, build with code, explore intelligence, and make difficult ideas feel alive. This is her little corner of the universe. Her research world. Her vision, still unfolding." }
];
const projects = [
  { tag:"NEURAL MODELLING", title:"EM-NAV", subtitle:"Representation geometry & navigation", jargon:"Investigating how spiking neural networks can represent spatial information, and how the geometry of those representations relates to navigation.", plain:"Imagine a brain building an internal map of space. This project explores how networks of artificial neurons might create and use those maps.", status:"COMPLETED WORK", color:"violet", href:"https://github.com/visionbyangelic/em-nav-representation-geometry" },
  { tag:"COMPUTATIONAL NEUROSCIENCE", title:"Connectome to Behaviour", subtitle:"From neural circuits to movement", jargon:"A multi-scale exploration connecting connectome-informed neural simulation with embodied behaviour using Brian2, FlyWire, MuJoCo and NeuroMechFly.", plain:"What if we could start with a map of neurons and ask what kind of movement that network could produce? This project explores the bridge between brain wiring and behaviour.", status:"EXPLORATION", color:"cyan", href:"https://github.com/visionbyangelic/ConnectomeToBehaviour" },
  { tag:"BRAIN IMAGING", title:"Brain Aging", subtitle:"Mapping variation across the lifespan", jargon:"Exploring MRI-derived morphometric measures, normative modelling and population-level variation using resources including OpenBHB and OASIS-3.", plain:"Brains change as people age, but not all brains change in the same way. Normative modelling helps us understand how an individual's brain measurements compare with a broader population.", status:"PROJECT", color:"rose", href:"https://github.com/visionbyangelic/brain-aging" },
  { tag:"MACHINE LEARNING", title:"Emotiwave", subtitle:"Emotion recognition when signals disappear", jargon:"A multimodal emotion-recognition project examining robustness under missing modalities across video, audio and text, with emphasis on fusion under sensor failure.", plain:"Imagine an AI that reads emotion using a face, voice and words. What happens when the microphone breaks or the camera goes dark? This project asks whether the system can still make sense of what remains.", status:"PROJECT", color:"amber", href:"https://github.com/visionbyangelic/Multimodal-Emotion-Recognition" },
  { tag:"NEURAL SIGNAL PROCESSING", title:"Neuro-Fatigue Prediction", subtitle:"Finding patterns in raw EEG", jargon:"A time-series modelling pipeline using raw EEG from consumer-grade hardware, signal processing and a 1D-CNN to investigate fatigue-related patterns.", plain:"Your brain produces electrical signals all the time. This project explores whether patterns in those signals can help identify fatigue, rather than relying only on how tired someone says they feel.", status:"PROJECT", color:"cyan", href:"https://github.com/visionbyangelic/Neuro-Fatigue-Prediction" }
];
function App() {
  const [chapter,setChapter] = useState(0);
  const [entered,setEntered] = useState(false);
  const [energy,setEnergy] = useState(.4);
  const [sound,setSound] = useState(false);
  const [plain,setPlain] = useState(true);
  const [menu,setMenu] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const playTone = (freq:number, duration=.5) => {
    if (!sound) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audio.current) {
        audio.current = new Ctx();
        master.current = audio.current!.createGain();
        master.current!.gain.value = .035;
        master.current!.connect(audio.current!.destination);
      }
      const ctx = audio.current!;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(freq,ctx.currentTime);
      gain.gain.setValueAtTime(.0001,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.08);
      gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
      osc.connect(gain); gain.connect(master.current!); osc.start(); osc.stop(ctx.currentTime+duration+.04);
    } catch {}
  };
  useEffect(()=>{ setEnergy(.35 + chapter*.2); if(chapter===5) setEntered(true); },[chapter]);
  useEffect(()=>{
    const timer = window.setInterval(()=>setChapter(current=>Math.min(current+1,5)), 7600);
    return ()=>window.clearInterval(timer);
  },[]);
  useEffect(()=>()=>{ void audio.current?.close(); },[]);
  const next = () => {
    const n = Math.min(chapter+1,5); setChapter(n); playTone([82,110,164.8,220,277.2,329.6][n],1.1);
    if(n===5) setEntered(true);
  };
  return <div className="atlas-shell">
    <div className="scene"><Canvas dpr={[1,1.5]} camera={{position:[0,0,10],fov:44}} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><Suspense fallback={null}><Scene energy={energy} awakened={entered} chapter={chapter}/></Suspense></Canvas></div>
    <div className="grain"/>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Angelic Research World home"><span className="brand-mark">✳</span><span>ANGELIC CHARLES <small>ANGELIC RESEARCH WORLD / 001</small></span></a>
      <nav className={menu?"nav open":"nav"}><a href="#atlas" onClick={()=>setMenu(false)}>THE ATLAS</a><a href="#research" onClick={()=>setMenu(false)}>RESEARCH</a><a href="#about" onClick={()=>setMenu(false)}>THE HUMAN</a><a href="#signals" onClick={()=>setMenu(false)}>SIGNALS</a></nav>
      <div className="top-actions"><button className={"sound-toggle "+(sound?"active":"")} onClick={()=>{setSound(!sound); if(!sound) playTone(220,.3);}} aria-label="Toggle ambient sound"><span className="sound-bars"><i/><i/><i/><i/></span><span>{sound?"SOUND ON":"SOUND OFF"}</span></button><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle menu">☰</button></div>
    </header>
    <main id="top">
      <section className={"genesis "+(chapter>=0?"story-mode":"")} aria-label="The Genesis cinematic introduction">
        <div className="genesis-orbit orbit-one"/><div className="genesis-orbit orbit-two"/>
        <div className="chapter-copy" key={chapter}>
          <p className="eyebrow"><span className="pulse-dot"/> CHAPTER {chapters[chapter].n} / {chapters[chapter].kicker}</p>
          <h2>{chapters[chapter].title}<span>.</span></h2><p>{chapters[chapter].copy}</p>
          {chapter===5 && <div className="storybook-angelic" aria-label="An animated storybook illustration of Angelic">
            <svg viewBox="0 0 180 210" role="img" aria-hidden="true">
              <ellipse cx="91" cy="194" rx="42" ry="7" fill="#9f83ef" opacity=".18"/>
              <path d="M55 90 Q43 32 91 28 Q140 30 127 93 L120 135 L60 135Z" fill="#21152d"/>
              <ellipse cx="94" cy="83" rx="29" ry="34" fill="#b97859"/>
              <path d="M65 79 Q63 43 94 39 Q127 42 125 79 Q111 61 96 58 Q82 74 65 79Z" fill="#24162f"/>
              <path d="M76 86 Q82 81 87 86 M101 86 Q107 81 113 86" fill="none" stroke="#39202b" strokeWidth="2" strokeLinecap="round"/>
              <path d="M91 91 Q95 95 98 91" fill="none" stroke="#754238" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M85 104 Q95 111 105 103" fill="none" stroke="#7a3445" strokeWidth="2" strokeLinecap="round"/>
              <path d="M69 121 Q94 111 119 123 L135 183 L53 183Z" fill="#9b83e8"/>
              <path d="M70 127 Q49 137 42 163" fill="none" stroke="#b97859" strokeWidth="11" strokeLinecap="round"/>
              <path className="angelic-wave" d="M118 128 Q142 105 145 77" fill="none" stroke="#b97859" strokeWidth="11" strokeLinecap="round"/>
              <circle cx="147" cy="72" r="7" fill="#b97859"/>
              <path d="M68 183 L65 197 M119 183 L123 197" stroke="#b97859" strokeWidth="9" strokeLinecap="round"/>
              <path d="M62 198 L48 201 M119 198 L135 201" stroke="#ddd1ff" strokeWidth="6" strokeLinecap="round"/>
              <circle cx="147" cy="54" r="3" fill="#d7c6ff"/><path d="M147 39 L147 32 M159 54 L166 54 M135 54 L128 54" stroke="#d7c6ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>ANGELIC · THE BEGINNING OF A VISION</span>
          </div>}
          <div className="chapter-controls"><div className="chapter-progress">{chapters.map((c,i)=><button key={c.n} aria-label={"Go to chapter "+c.n} className={i<=chapter?"filled":""} onClick={()=>{setChapter(i);if(i===5)setEntered(true)}}/>)}</div><button className="text-cta" onClick={()=>chapter===5?document.getElementById("atlas")?.scrollIntoView({behavior:"smooth"}):next()}>{chapter===5?"ENTER ANGELIC RESEARCH WORLD":"CONTINUE THE JOURNEY"} <span>↗</span></button></div>
        </div>
        <div className="scene-caption"><span>FIG. 001</span><span>FROM THE BIG BANG TO THE HUMAN MIND</span><span>0{Math.max(1,chapter+1)} / 06</span></div>
        <div className="vertical-note">13.8 BILLION YEARS · ONE CONTINUOUS STORY</div>
      </section>
      <section className="manifesto section-pad" id="atlas">
        <div className="section-index">01 / THE ATLAS</div><div className="manifesto-grid"><div><p className="eyebrow">A PERSONAL RESEARCH WORLD</p><h2>Not one answer.<br/><em>A thousand ways in.</em></h2></div><div className="manifesto-text"><p className="large-copy">I am Angelic Charles, a <strong>computational neuroscientist</strong> exploring the space between biological intelligence, computation and the ideas that shape how we understand the mind.</p><p>This atlas is a living map of my work and curiosity. It moves across research, machine learning, brain imaging, neural systems, science communication and the questions I haven't learned how to ask yet.</p><a className="underlink" href="#research">EXPLORE THE RESEARCH <span>↗</span></a></div></div>
        <div className="coordinate-line"><span>LAT 06°27' N</span><span>COORDINATES OF CURIOSITY</span><span>LONG 07°30' E</span></div>
      </section>
      <section className="research section-pad" id="research">
        <div className="section-heading"><div><div className="section-index">02 / RESEARCH WORLDS</div><p className="eyebrow">FRAGMENTS OF AN ONGOING INQUIRY</p><h2>Ideas under<br/><em>investigation.</em></h2></div><p className="heading-aside">Different questions. Different methods. One curious mind. These projects do not belong to a single corner of neuroscience, and neither does this atlas.</p></div>
        <div className="project-grid">{projects.map((p,i)=><article className={"project-card "+p.color} key={p.title}>
          <div className="project-art"><div className="art-grid"/><div className="art-orb"><span/><i/><b/></div><span className="art-number">0{i+1}</span><span className="art-label">{p.tag}</span><div className="art-cross">✳</div></div>
          <div className="project-body"><div className="project-meta"><span>{p.status}</span><span>FIELD NOTE / 0{i+1}</span></div><h3>{p.title}</h3><p className="project-subtitle">{p.subtitle}</p><div className="explanation"><div className="explanation-head"><span>{plain?"IN PLAIN LANGUAGE":"TECHNICAL VIEW"}</span><button onClick={()=>setPlain(!plain)}>{plain?"SHOW JARGON":"SHOW PLAIN ENGLISH"} ↗</button></div><p>{plain?p.plain:p.jargon}</p></div><a className="project-link" href={p.href} target="_blank" rel="noreferrer">EXPLORE PROJECT <span>↗</span></a></div>
        </article>)}</div>
        <p className="project-footnote">Project descriptions distinguish exploratory work from established findings. This portfolio is a record of inquiry, not a claim of publication.</p>
      </section>
      <section className="interlude"><div className="interlude-art"><div className="interlude-ring"/><div className="interlude-ring r2"/><span>?</span></div><div><p className="eyebrow">A QUESTION BETWEEN WORLDS</p><h2>What does it mean<br/>to <em>understand</em> a brain?</h2><p>Is a model an explanation, a useful approximation, or a new way to ask the question? I am interested in the space where computation meets uncertainty.</p></div></section>
      <section className="about section-pad" id="about">
        <div className="section-index">03 / THE HUMAN BEHIND THE HYPOTHESES</div><div className="about-grid"><div><p className="eyebrow">BEYOND THE LAB</p><h2>Curiosity is<br/>my <em>method.</em></h2><p className="about-lede">Science is what I study. Wonder is how I move through it.</p></div><div className="about-copy"><p>I work across computational neuroscience, brain imaging, machine learning and data science. I am drawn to projects that let different disciplines speak to one another, and I am still discovering which questions I want to spend a lifetime pursuing.</p><p>Outside technical work, I write about science, consciousness, philosophy and the strange edges of ordinary experience. I founded <strong>Research As Stories</strong>, a broad science and knowledge publication built around making research engaging without losing its substance.</p><div className="interest-cloud"><span>CONSCIOUSNESS</span><span>COMPLEX SYSTEMS</span><span>PHILOSOPHY</span><span>ASTRONOMY</span><span>AI & LEARNING</span><span>THE UNKNOWN</span></div><div className="about-links"><a href="https://visionbyangelic.substack.com/" target="_blank" rel="noreferrer">PERSONAL SUBSTACK ↗</a><a href="https://researchasstories.substack.com/" target="_blank" rel="noreferrer">RESEARCH AS STORIES ↗</a></div></div></div>
      </section>
      <section className="signals section-pad" id="signals"><div className="section-index">04 / OUTGOING SIGNALS</div><div className="signals-grid"><div><p className="eyebrow">FIND ME IN THE NETWORK</p><h2>Follow the<br/><em>curiosity.</em></h2></div><div className="signal-links"><a href="https://github.com/visionbyangelic" target="_blank" rel="noreferrer"><span>01</span> GITHUB <b>↗</b></a><a href="https://visionbyangelic.substack.com/" target="_blank" rel="noreferrer"><span>02</span> PERSONAL WRITING <b>↗</b></a><a href="https://researchasstories.substack.com/" target="_blank" rel="noreferrer"><span>03</span> RESEARCH AS STORIES <b>↗</b></a><a href="https://hashnode.com/@ZQQ" target="_blank" rel="noreferrer"><span>04</span> TECHNICAL WRITING <b>↗</b></a></div></div></section>
    </main>
    <footer><a className="brand" href="#top"><span className="brand-mark">✳</span><span>ANGELIC CHARLES <small>ANGELIC RESEARCH WORLD / 001</small></span></a><span>BUILT FROM QUESTIONS, NOT CONCLUSIONS.</span><a href="#top">BACK TO THE BEGINNING ↑</a></footer>
  </div>;
}
export default App;