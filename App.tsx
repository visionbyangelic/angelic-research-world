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
const projects = [
  { tag:"NEURAL MODELLING", title:"EM-NAV", subtitle:"Representation geometry & navigation", jargon:"Investigating how spiking neural networks can represent spatial information, and how the geometry of those representations relates to navigation.", plain:"Imagine a brain building an internal map of space. This project explores how networks of artificial neurons might create and use those maps.", status:"COMPLETED WORK", color:"violet", href:"https://github.com/visionbyangelic/em-nav-representation-geometry" },
  { tag:"COMPUTATIONAL NEUROSCIENCE", title:"Connectome to Behaviour", subtitle:"From neural circuits to movement", jargon:"A multi-scale exploration connecting connectome-informed neural simulation with embodied behaviour using Brian2, FlyWire, MuJoCo and NeuroMechFly.", plain:"What if we could start with a map of neurons and ask what kind of movement that network could produce? This project explores the bridge between brain wiring and behaviour.", status:"EXPLORATION", color:"cyan", href:"https://github.com/visionbyangelic/ConnectomeToBehaviour" },
  { tag:"BRAIN IMAGING", title:"Brain Aging", subtitle:"Mapping variation across the lifespan", jargon:"Exploring MRI-derived morphometric measures, normative modelling and population-level variation using resources including OpenBHB and OASIS-3.", plain:"Brains change as people age, but not all brains change in the same way. Normative modelling helps us understand how an individual's brain measurements compare with a broader population.", status:"PROJECT", color:"rose", href:"https://github.com/visionbyangelic/brain-aging" },
  { tag:"MACHINE LEARNING", title:"Emotiwave", subtitle:"Emotion recognition when signals disappear", jargon:"A multimodal emotion-recognition project examining robustness under missing modalities across video, audio and text, with emphasis on fusion under sensor failure.", plain:"Imagine an AI that reads emotion using a face, voice and words. What happens when the microphone breaks or the camera goes dark? This project asks whether the system can still make sense of what remains.", status:"PROJECT", color:"amber", href:"https://github.com/visionbyangelic/Multimodal-Emotion-Recognition" },
  { tag:"NEURAL SIGNAL PROCESSING", title:"Neuro-Fatigue Prediction", subtitle:"Finding patterns in raw EEG", jargon:"A time-series modelling pipeline using raw EEG from consumer-grade hardware, signal processing and a 1D-CNN to investigate fatigue-related patterns.", plain:"Your brain produces electrical signals all the time. This project explores whether patterns in those signals can help identify fatigue, rather than relying only on how tired someone says they feel.", status:"PROJECT", color:"cyan", href:"https://github.com/visionbyangelic/Neuro-Fatigue-Prediction" }
];

function ProjectArtwork({index}:{index:number}) {
  return <svg className={"project-visual visual-"+index} viewBox="0 0 640 300" role="img" aria-label={["Spatial neural representation map","Connectome synaptic network","Brain MRI scan and age-related morphology","Multimodal emotion signals","EEG neural signal waveform"][index]} preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id={"glow"+index}><stop stopColor="currentColor" stopOpacity=".48"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient><linearGradient id={"line"+index} x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".9"/><stop offset="1" stopColor="currentColor" stopOpacity=".12"/></linearGradient></defs>
    <rect width="640" height="300" fill="#080b16"/><circle cx="320" cy="150" r="170" fill={"url(#glow"+index+")"}/>
    {index===0 && <g fill="none" stroke="currentColor">{Array.from({length:9},(_,i)=><path key={i} d={"M"+(90+i*58)+" 28 V272"} opacity=".13"/>)}{Array.from({length:5},(_,i)=><path key={"h"+i} d={"M70 "+(55+i*48)+" H570"} opacity=".13"/>)}{Array.from({length:7},(_,i)=><circle key={"c"+i} cx={130+i*62} cy={95+(i%2)*95} r={22+(i%3)*8} strokeWidth="2" opacity=".5"/>)}<path d="M120 150 L205 88 L292 150 L380 90 L470 155 L530 100" strokeWidth="2.5" strokeDasharray="5 8"/><circle cx="292" cy="150" r="9" fill="currentColor"/><circle cx="292" cy="150" r="25" opacity=".5"/></g>}
    {index===1 && <g fill="none" stroke="url(#line1)" strokeWidth="2.4" strokeLinecap="round"><path d="M320 260 C300 210 335 185 310 145 S260 95 230 40 M310 145 C360 110 365 78 390 35 M310 145 C260 140 215 160 165 115 M310 145 C365 160 410 190 465 145 M320 260 C365 220 400 245 445 270 M320 260 C270 220 220 245 180 270"/>{Array.from({length:24},(_,i)=><circle key={i} cx={90+(i*73)%470} cy={40+(i*47)%220} r={3+(i%3)} fill="currentColor" stroke="none" opacity=".75"/>)}<circle cx="310" cy="145" r="13" fill="currentColor" stroke="none"/><circle cx="310" cy="145" r="29" opacity=".3"/></g>}
    {index===2 && <g fill="none" stroke="currentColor"><path d="M320 42 C250 30 180 72 172 139 C160 211 218 253 320 260 C422 253 480 211 468 139 C460 72 390 30 320 42Z" strokeWidth="2.5" opacity=".8"/><path d="M320 55 C260 55 205 88 202 145 C198 201 246 233 320 242 C394 233 442 201 438 145 C435 88 380 55 320 55Z" opacity=".6"/><path d="M320 55 V245 M180 150 H460 M220 94 C270 120 270 180 220 210 M420 94 C370 120 370 180 420 210" opacity=".42"/><path d="M265 90 C235 115 255 140 280 150 C250 175 270 210 300 215 M375 90 C405 115 385 140 360 150 C390 175 370 210 340 215" strokeWidth="3"/><circle cx="320" cy="150" r="5" fill="currentColor"/></g>}
    {index===3 && <g fill="none" stroke="currentColor"><rect x="90" y="55" width="175" height="190" rx="18" strokeWidth="2" opacity=".7"/><path d="M150 126 C150 95 205 95 205 126 C205 150 190 160 177 174 C164 160 150 150 150 126Z" strokeWidth="2"/><path d="M148 205 Q177 180 206 205" strokeWidth="2"/><path d="M300 150 H340 M340 150 Q360 60 380 150 T420 150 T460 150 T500 150 T540 150" strokeWidth="3" strokeLinecap="round"/>{Array.from({length:12},(_,i)=><path key={i} d={"M"+(300+i*25)+" "+(235-Math.sin(i*.8)*32)+" v"+(Math.sin(i*.8)*64)} strokeWidth="4" opacity=".65"/>)}<circle cx="420" cy="150" r="74" strokeDasharray="4 8" opacity=".4"/></g>}
    {index===4 && <g fill="none" stroke="currentColor">{Array.from({length:12},(_,i)=><path key={i} d={"M70 "+(45+i*19)+" H570"} opacity=".12"/>)}<path d={"M70 150 "+Array.from({length:60},(_,i)=>"L"+(70+i*8.4)+" "+(150-Math.sin(i*.72)*((i%7===0)?72:22)-Math.cos(i*.21)*18)).join(" ")} strokeWidth="3" strokeLinecap="round"/><path d="M70 150 H570" strokeDasharray="4 9" opacity=".4"/><path d="M130 55 V245 M320 55 V245 M510 55 V245" strokeDasharray="3 7" opacity=".25"/><circle cx="320" cy="150" r="92" strokeDasharray="2 10" opacity=".4"/></g>}
  </svg>;
}

function App() {
  if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
    window.location.replace("/genesis.html");
    return null;
  }
  const [plain,setPlain] = useState(true);
  const [menu,setMenu] = useState(false);
  return <div className="atlas-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Angelic Research World home"><span className="brand-mark">✳</span><span>ANGELIC CHARLES <small>ANGELIC RESEARCH WORLD / 001</small></span></a>
      <nav className={menu?"nav open":"nav"}><a href="#top" onClick={()=>setMenu(false)}>HOME</a><a href="#research" onClick={()=>setMenu(false)}>RESEARCH</a><a href="#about" onClick={()=>setMenu(false)}>THE HUMAN</a><a href="#signals" onClick={()=>setMenu(false)}>SIGNALS</a></nav>
      <div className="top-actions"><button className="menu-toggle" onClick={()=>setMenu(!menu)} aria-label="Toggle menu">☰</button></div>
    </header>
    <main>      <section className="portfolio-hero section-pad" id="top">
        <div className="hero-orbit" aria-hidden="true"></div>
        <p className="eyebrow">COMPUTATIONAL NEUROSCIENCE · MACHINE LEARNING · BRAIN IMAGING</p>
        <h1>Angelic <em>Charles.</em></h1>
        <p className="hero-role">Researcher. Builder. Curious about the mind.</p>
        <div className="hero-rule"></div>
      </section>
      <section className="about section-pad" id="about">
        <div className="section-index">03 / THE HUMAN BEHIND THE HYPOTHESES</div><div className="about-grid"><div><p className="eyebrow">BEYOND THE LAB</p><h2>Curiosity is<br/>my <em>method.</em></h2><p className="about-lede">Science is what I study. Wonder is how I move through it.</p></div><div className="about-copy"><p>I work across computational neuroscience, brain imaging, machine learning and data science. I am drawn to projects that let different disciplines speak to one another, and I am still discovering which questions I want to spend a lifetime pursuing.</p><p>Outside technical work, I write about science, consciousness, philosophy and the strange edges of ordinary experience. I founded <strong>Research As Stories</strong>, a broad science and knowledge publication built around making research engaging without losing its substance.</p><div className="interest-cloud"><span>CONSCIOUSNESS</span><span>COMPLEX SYSTEMS</span><span>PHILOSOPHY</span><span>ASTRONOMY</span><span>AI & LEARNING</span><span>THE UNKNOWN</span></div><div className="about-links"><a href="https://visionbyangelic.substack.com/" target="_blank" rel="noreferrer">PERSONAL SUBSTACK ↗</a><a href="https://researchasstories.substack.com/" target="_blank" rel="noreferrer">RESEARCH AS STORIES ↗</a></div></div></div>
      </section>
      <section className="research section-pad" id="research">
        <div className="section-heading"><div><div className="section-index">02 / RESEARCH WORLDS</div><p className="eyebrow">FRAGMENTS OF AN ONGOING INQUIRY</p><h2>Ideas under<br/><em>investigation.</em></h2></div><p className="heading-aside">Different questions. Different methods. One curious mind. These projects do not belong to a single corner of neuroscience, and neither does this atlas.</p></div>
        <div className="project-grid">{projects.map((p,i)=><article className={"project-card "+p.color} key={p.title}>
          <div className={"project-art art-"+i}><ProjectArtwork index={i}/><span className="art-number">0{i+1}</span><span className="art-label">{p.tag}</span></div>
          <div className="project-body"><div className="project-meta"><span>{p.status}</span><span>FIELD NOTE / 0{i+1}</span></div><h3>{p.title}</h3><p className="project-subtitle">{p.subtitle}</p><div className="explanation"><div className="explanation-head"><span>{plain?"IN PLAIN LANGUAGE":"TECHNICAL VIEW"}</span><button onClick={()=>setPlain(!plain)}>{plain?"SHOW JARGON":"SHOW PLAIN ENGLISH"} ↗</button></div><p>{plain?p.plain:p.jargon}</p></div><a className="project-link" href={p.href} target="_blank" rel="noreferrer">EXPLORE PROJECT <span>↗</span></a></div>
        </article>)}</div>
        <p className="project-footnote">Project descriptions distinguish exploratory work from established findings. This portfolio is a record of inquiry, not a claim of publication.</p>
      </section>
      <section className="interlude"><div className="interlude-art"><div className="interlude-ring"/><div className="interlude-ring r2"/><span>?</span></div><div><p className="eyebrow">A QUESTION BETWEEN WORLDS</p><h2>What does it mean<br/>to <em>understand</em> a brain?</h2><p>Is a model an explanation, a useful approximation, or a new way to ask the question? I am interested in the space where computation meets uncertainty.</p></div></section>
      <section className="signals section-pad" id="signals"><div className="section-index">04 / OUTGOING SIGNALS</div><div className="signals-grid"><div><p className="eyebrow">FIND ME IN THE NETWORK</p><h2>Follow the<br/><em>curiosity.</em></h2></div><div className="signal-links"><a href="https://github.com/visionbyangelic" target="_blank" rel="noreferrer"><span>01</span> GITHUB <b>↗</b></a><a href="https://visionbyangelic.substack.com/" target="_blank" rel="noreferrer"><span>02</span> PERSONAL WRITING <b>↗</b></a><a href="https://researchasstories.substack.com/" target="_blank" rel="noreferrer"><span>03</span> RESEARCH AS STORIES <b>↗</b></a><a href="https://hashnode.com/@ZQQ" target="_blank" rel="noreferrer"><span>04</span> TECHNICAL WRITING <b>↗</b></a></div></div></section>
    </main>ain>
    <footer><a className="brand" href="#top"><span className="brand-mark">✳</span><span>ANGELIC CHARLES <small>ANGELIC RESEARCH WORLD / 001</small></span></a><span>BUILT FROM QUESTIONS, NOT CONCLUSIONS.</span><a href="#top">BACK TO THE BEGINNING ↑</a></footer>
  </div>;
}
export default App;