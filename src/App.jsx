import { useState, useRef } from "react";

// ─── PALETTE: Morning Dew ─────────────────────────────────────────────────────
const C = {
  bg:          "#252d2e",
  surface:     "#2e393b",
  surfaceHigh: "#344447",
  border:      "#3d5052",
  borderHi:    "#4d6668",
  accent:      "#5dbf8a",
  accentDim:   "#5dbf8a18",
  accentBorder:"#5dbf8a55",
  accentGlow:  "#5dbf8a30",
  text:        "#dff0ea",
  textMuted:   "#7aaa96",
  textDim:     "#4a7060",
  scoreHigh:   "#5dbf8a",
  scoreMid:    "#d4c56a",
  scoreLow:    "#bf7a5d",
  scoreBad:    "#9e6060",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_COURSES = [
  { id:1, name:"Pebble Creek Municipal", type:"municipal",    difficulty:6.2, price:38,  walkable:true,  lat:38.79, lng:-121.23, city:"Rocklin"    },
  { id:2, name:"Sierra Pines Golf Club", type:"public",       difficulty:7.8, price:89,  walkable:false, lat:38.75, lng:-121.28, city:"Roseville"  },
  { id:3, name:"Granite Bay Greens",     type:"public",       difficulty:8.4, price:115, walkable:true,  lat:38.77, lng:-121.18, city:"Granite Bay" },
  { id:4, name:"Lincoln Hills Golf",     type:"municipal",    difficulty:5.9, price:45,  walkable:true,  lat:38.89, lng:-121.30, city:"Lincoln"    },
  { id:5, name:"Woodcreek Oaks",         type:"public",       difficulty:7.1, price:72,  walkable:false, lat:38.72, lng:-121.20, city:"Roseville"  },
  { id:6, name:"Coyote Ridge CC",        type:"semi-private", difficulty:8.9, price:145, walkable:false, lat:38.80, lng:-121.15, city:"Rocklin"    },
  { id:7, name:"Foothill Ranch GC",      type:"public",       difficulty:6.7, price:55,  walkable:true,  lat:38.85, lng:-121.10, city:"Auburn"     },
  { id:8, name:"Diamond Oaks Golf",      type:"municipal",    difficulty:5.5, price:32,  walkable:true,  lat:38.70, lng:-121.32, city:"Roseville"  },
];

const ZIP_TO_COORDS = {
  "95765":[38.79,-121.23],"95747":[38.77,-121.28],"95746":[38.77,-121.18],
  "95648":[38.89,-121.30],"95678":[38.72,-121.22],"95661":[38.75,-121.25],
};
function zipToCoords(zip) { return ZIP_TO_COORDS[zip]||[38.79,-121.23]; }

function getDistanceMiles(la1,lo1,la2,lo2) {
  const R=3958.8,dL=((la2-la1)*Math.PI)/180,dO=((lo2-lo1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function generateTeeTimes(courseId, requestedTime) {
  const [rH,rM]=requestedTime.split(":").map(Number);
  const times=[],seed0=courseId*7;
  for (let d=-60;d<=60;d+=10) {
    const tot=rH*60+rM+d;
    if (tot<0||tot>=22*60) continue;
    const h=Math.floor(tot/60),m=tot%60;
    const label=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    const s=(courseId*13+d*3+seed0)%100;
    const open=s<20?4:s<45?3:s<70?2:s<88?1:0;
    if (open>0) times.push({time:label,openSlots:open,filledSlots:4-open,totalSlots:4,singleAvailable:open===4});
  }
  return times;
}

function scoreTeeTime(course,tt,date,hoursUntil) {
  let s=5;
  const hr=parseInt(tt.time.split(":")[0]);
  const dow=new Date(date+"T12:00:00").getDay();
  const mon=new Date(date+"T12:00:00").getMonth();
  if (hr<7) s+=2; else if (hr<8) s+=1;
  if (dow>=2&&dow<=4) s+=1;
  if (dow===0||dow===6) s-=2;
  if (hr>=10&&hr<=14) s-=2;
  if (hr>=17) s+=1;
  if (mon>=10||mon<=1) s+=1;
  if (tt.singleAvailable) s+=2;
  else if (tt.openSlots===3) s+=1;
  else if (tt.openSlots===1) s-=1;
  if (tt.filledSlots===0) s+=1;
  if (course.type==="municipal") s+=0.5;
  if (course.difficulty>=8) s+=0.5;
  if (course.price>=100) s+=1;
  if (course.walkable) s+=0.5;
  if (hoursUntil<=24) s+=1;
  if (hoursUntil<=4) s+=0.5;
  return Math.min(10,Math.max(1,Math.round(s*10)/10));
}

function scoreColor(sc) {
  if (sc>=8) return C.scoreHigh;
  if (sc>=6) return C.scoreMid;
  if (sc>=4) return C.scoreLow;
  return C.scoreBad;
}
function scoreLabel(sc) {
  if (sc>=8) return "Excellent";
  if (sc>=6) return "Good";
  if (sc>=4) return "Fair";
  return "Low";
}

// ─── SCORE BADGE ─────────────────────────────────────────────────────────────
function ScoreBadge({score,size=52}) {
  const col=scoreColor(score), inner=size*0.76;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{
        width:size,height:size,borderRadius:"50%",
        background:`conic-gradient(${col} ${score*36}deg, ${C.border} 0deg)`,
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 14px ${col}38`,
      }}>
        <div style={{
          width:inner,height:inner,borderRadius:"50%",background:C.surface,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'Bebas Neue',cursive",fontSize:size*0.38,color:col,letterSpacing:0,
        }}>{score}</div>
      </div>
      <span style={{fontSize:9,color:col,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}

// ─── TEE TIME ROW ─────────────────────────────────────────────────────────────
function TeeTimeRow({tt,score}) {
  const col=scoreColor(score);
  return (
    <div
      style={{
        background:C.surfaceHigh,border:`1px solid ${C.border}`,borderLeft:`3px solid ${col}`,
        borderRadius:8,padding:"11px 14px",display:"flex",alignItems:"center",gap:14,
        marginBottom:6,transition:"background 0.15s",cursor:"default",
      }}
      onMouseEnter={e=>e.currentTarget.style.background=C.borderHi}
      onMouseLeave={e=>e.currentTarget.style.background=C.surfaceHigh}
    >
      <ScoreBadge score={score} size={46}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:C.text,letterSpacing:"0.06em"}}>
            {tt.time}
          </span>
          {tt.singleAvailable && (
            <span style={{
              background:C.accentDim,border:`1px solid ${C.accentBorder}`,
              color:C.accent,fontSize:9,padding:"2px 7px",borderRadius:99,fontFamily:"monospace",
              letterSpacing:"0.1em",
            }}>SINGLE AVAIL</span>
          )}
        </div>
        <div style={{color:C.textDim,fontSize:11,fontFamily:"monospace",marginTop:2}}>
          {tt.openSlots} of {tt.totalSlots} slots open · {tt.filledSlots} booked
        </div>
      </div>
      <div style={{display:"flex",gap:3}}>
        {Array.from({length:tt.totalSlots},(_,i)=>(
          <span key={i} style={{color:i<tt.filledSlots?C.border:col,fontSize:13}}>●</span>
        ))}
      </div>
    </div>
  );
}

// ─── COURSE CARD ─────────────────────────────────────────────────────────────
function CourseCard({course,teeTimes,date,hoursUntil}) {
  const [open,setOpen]=useState(false);
  const scored=teeTimes
    .map(t=>({...t,score:scoreTeeTime(course,t,date,hoursUntil)}))
    .sort((a,b)=>b.score-a.score);
  const best=scored[0]?.score??0;
  const col=scoreColor(best);

  return (
    <div style={{
      background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,
      overflow:"hidden",marginBottom:14,boxShadow:"0 4px 20px rgba(0,0,0,0.28)",
      transition:"border-color 0.2s",
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHi}
    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
    >
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{
          padding:"16px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",
          transition:"background 0.15s",
          borderBottom:open?`1px solid ${C.border}`:"none",
        }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap",marginBottom:5}}>
            <h3 style={{margin:0,color:C.text,fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700}}>
              {course.name}
            </h3>
            <span style={{
              background:"rgba(255,255,255,0.05)",color:C.textMuted,
              fontSize:9,padding:"2px 8px",borderRadius:99,fontFamily:"monospace",
              textTransform:"uppercase",letterSpacing:"0.1em",
            }}>{course.type}</span>
          </div>
          <div style={{color:C.textDim,fontSize:11,fontFamily:"monospace",display:"flex",gap:14,flexWrap:"wrap"}}>
            <span>📍 {course.city} · {course.distance?.toFixed(1)} mi</span>
            <span>⛳ Diff {course.difficulty}</span>
            <span>💵 ${course.price}</span>
            <span>{course.walkable?"🚶 Walk":"🚗 Cart"}</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:C.textDim,fontFamily:"monospace",fontSize:10}}>BEST</span>
            <div style={{
              background:`${col}15`,border:`1px solid ${col}50`,borderRadius:8,
              padding:"3px 12px",fontFamily:"'Bebas Neue',cursive",fontSize:22,
              color:col,letterSpacing:"0.06em",boxShadow:`0 0 10px ${col}22`,
            }}>{best}</div>
          </div>
          <span style={{color:C.textDim,fontSize:10,fontFamily:"monospace"}}>
            {scored.length} times · {open?"▲":"▼"}
          </span>
        </div>
      </div>
      {open && (
        <div style={{padding:"14px 18px",background:C.bg}}>
          {scored.map((t,i)=><TeeTimeRow key={i} tt={t} score={t.score}/>)}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function GolfAlone() {
  const [zip,     setZip]      = useState("95765");
  const [teeTime, setTeeTime]  = useState("08:00");
  const [date,    setDate]     = useState(()=>{
    const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0];
  });
  const [radius,    setRadius]    = useState(25);
  const [results,   setResults]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [sortBy,    setSortBy]    = useState("score");
  const [filterMin, setFilterMin] = useState(1);
  const [searched,  setSearched]  = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    setLoading(true); setSearched(true);
    setTimeout(()=>{
      const [lat,lng]=zipToCoords(zip);
      const now=new Date(), tdt=new Date(date+"T"+teeTime+":00"), hrs=(tdt-now)/36e5;
      const courses=MOCK_COURSES
        .map(c=>({...c,distance:getDistanceMiles(lat,lng,c.lat,c.lng)}))
        .filter(c=>c.distance<=radius)
        .map(c=>({...c,teeTimes:generateTeeTimes(c.id,teeTime),hoursUntil:hrs}))
        .filter(c=>c.teeTimes.length>0)
        .map(c=>({...c,bestScore:Math.max(...c.teeTimes.map(t=>scoreTeeTime(c,t,date,hrs)))}));
      setResults(courses);
      setLoading(false);
    },1200);
  }

  const sorted=(results||[])
    .filter(c=>c.bestScore>=filterMin)
    .sort((a,b)=>{
      if (sortBy==="score")    return b.bestScore-a.bestScore;
      if (sortBy==="distance") return a.distance-b.distance;
      if (sortBy==="price")    return a.price-b.price;
      return 0;
    });

  const dayName=new Date(date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});

  const inputStyle={
    width:"100%",background:"rgba(255,255,255,0.04)",
    border:`1px solid ${C.border}`,borderRadius:8,
    padding:"10px 14px",color:C.text,
    fontFamily:"'DM Mono',monospace",fontSize:14,
    transition:"border-color 0.2s, box-shadow 0.2s",colorScheme:"dark",
  };
  const labelStyle={
    display:"block",color:C.textDim,fontSize:10,
    fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",
    textTransform:"uppercase",marginBottom:6,
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans',sans-serif",position:"relative",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500&family=DM+Mono&display=swap');
        *{box-sizing:border-box;}
        input,select{outline:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 2px ${C.accentGlow}!important;}
        ::-webkit-scrollbar{width:4px;background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(-12deg)}50%{transform:translateY(-10px) rotate(-8deg)}}
        .card-in{animation:fadeUp 0.35s ease forwards;}
        button{transition:all 0.15s;}
      `}</style>

      {/* Background glows */}
      <div style={{position:"fixed",top:-150,left:-150,width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-100,right:-100,width:420,height:420,borderRadius:"50%",background:"radial-gradient(circle, rgba(93,191,138,0.05) 0%, transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* Floating ball deco */}
      <div style={{position:"fixed",right:-55,top:170,width:210,height:210,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%, ${C.surfaceHigh}, ${C.bg})`,border:`1px solid ${C.border}`,opacity:0.22,animation:"float 7s ease-in-out infinite",pointerEvents:"none",zIndex:0}}>
        {Array.from({length:20},(_,i)=>(
          <div key={i} style={{position:"absolute",width:11,height:11,borderRadius:"50%",background:"rgba(0,0,0,0.25)",left:`${12+(i%4)*22}%`,top:`${12+Math.floor(i/4)*22}%`}}/>
        ))}
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:780,margin:"0 auto",padding:"36px 16px"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:12,marginBottom:10}}>
            <span style={{fontSize:26}}>⛳</span>
            <h1 style={{
              margin:0,fontFamily:"'Bebas Neue',cursive",
              fontSize:"clamp(46px,10vw,70px)",letterSpacing:"0.14em",
              background:`linear-gradient(135deg, ${C.accent} 0%, #8ed4b0 50%, ${C.accent} 100%)`,
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1,
            }}>GOLF ALONE</h1>
            <span style={{fontSize:26}}>⛳</span>
          </div>
          <p style={{margin:0,color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase"}}>
            Find your perfect solo round
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{
          background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,
          padding:"26px 24px",marginBottom:28,
          boxShadow:`0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:16,marginBottom:18}}>
            <div>
              <label style={labelStyle}>Zip Code</label>
              <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="95765" maxLength={5} required style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} required style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Tee Time</label>
              <input type="time" value={teeTime} onChange={e=>setTeeTime(e.target.value)} required style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Radius: {radius} mi</label>
              <input type="range" min={5} max={50} step={5} value={radius}
                onChange={e=>setRadius(Number(e.target.value))}
                style={{width:"100%",marginTop:12,accentColor:C.accent,cursor:"pointer"}}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            width:"100%",padding:"13px 24px",
            background:loading?`${C.accent}12`:`linear-gradient(135deg, ${C.accent}, #3da872)`,
            border:"none",borderRadius:10,cursor:loading?"not-allowed":"pointer",
            color:loading?C.accent:C.bg,
            fontFamily:"'Bebas Neue',cursive",fontSize:19,letterSpacing:"0.16em",
            boxShadow:loading?"none":`0 4px 18px ${C.accentGlow}`,
          }}
          onMouseEnter={e=>{if(!loading)e.target.style.opacity="0.88";}}
          onMouseLeave={e=>{e.target.style.opacity="1";}}
          >
            {loading?(
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                <span style={{display:"inline-block",width:15,height:15,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
                SCANNING COURSES...
              </span>
            ):"FIND SOLO TIMES ⛳"}
          </button>
        </form>

        {/* Results */}
        {searched && !loading && results!==null && (
          <div style={{animation:"fadeUp 0.4s ease"}}>
            {/* Stats bar */}
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              flexWrap:"wrap",gap:12,marginBottom:18,
              padding:"11px 16px",background:C.accentDim,
              border:`1px solid ${C.accentBorder}`,borderRadius:10,
            }}>
              <div>
                <span style={{color:C.accent,fontFamily:"'Bebas Neue',cursive",fontSize:22,letterSpacing:"0.08em"}}>{sorted.length}</span>
                <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:11,marginLeft:7}}>
                  courses · {dayName} · ±1hr of {teeTime}
                </span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:C.textDim,fontSize:10,fontFamily:"monospace"}}>Sort:</span>
                {["score","distance","price"].map(s=>(
                  <button key={s} onClick={()=>setSortBy(s)} style={{
                    background:sortBy===s?`${C.accent}20`:"transparent",
                    border:`1px solid ${sortBy===s?C.accentBorder:C.border}`,
                    borderRadius:6,padding:"3px 10px",cursor:"pointer",
                    color:sortBy===s?C.accent:C.textDim,
                    fontFamily:"monospace",fontSize:10,textTransform:"capitalize",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            {/* Min score filter */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <span style={{color:C.textDim,fontSize:10,fontFamily:"monospace",whiteSpace:"nowrap"}}>Min score: {filterMin}</span>
              <input type="range" min={1} max={9} step={1} value={filterMin}
                onChange={e=>setFilterMin(Number(e.target.value))}
                style={{flex:1,accentColor:C.accent,cursor:"pointer"}}
              />
              <div style={{display:"flex",gap:4}}>
                {[{v:8,l:"8+"},{v:6,l:"6+"},{v:1,l:"All"}].map(({v,l})=>(
                  <button key={v} onClick={()=>setFilterMin(v)} style={{
                    background:filterMin===v?`${scoreColor(v)}18`:"transparent",
                    border:`1px solid ${scoreColor(v)}44`,borderRadius:6,
                    padding:"3px 8px",cursor:"pointer",color:scoreColor(v),
                    fontFamily:"monospace",fontSize:10,
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
              {[{c:C.scoreHigh,l:"8–10 Excellent"},{c:C.scoreMid,l:"6–7 Good"},{c:C.scoreLow,l:"4–5 Fair"},{c:C.scoreBad,l:"1–3 Low"}].map(({c,l})=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
                  <span style={{color:C.textDim,fontSize:10,fontFamily:"monospace"}}>{l}</span>
                </div>
              ))}
            </div>

            {sorted.length===0?(
              <div style={{textAlign:"center",padding:"48px 24px",background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:44,marginBottom:14}}>⛳</div>
                <p style={{color:C.textDim,fontFamily:"monospace",margin:0,lineHeight:1.6}}>
                  No courses found matching your criteria.<br/>Try expanding your radius or lowering the minimum score.
                </p>
              </div>
            ):sorted.map((course,i)=>(
              <div key={course.id} className="card-in" style={{animationDelay:`${i*0.06}s`,opacity:0}}>
                <CourseCard course={course} teeTimes={course.teeTimes} date={date} hoursUntil={course.hoursUntil}/>
              </div>
            ))}
          </div>
        )}

        {/* How it works pre-search */}
        {!searched && (
          <div style={{
            background:C.surface,border:`1px solid ${C.border}`,
            borderRadius:16,padding:"26px 24px",
            animation:"fadeUp 0.5s ease 0.15s both",
          }}>
            <h2 style={{margin:"0 0 20px",fontFamily:"'Playfair Display',serif",color:C.accent,fontSize:19}}>
              How Scores Work
            </h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:18}}>
              {[
                {icon:"🌅",title:"Time of Day",   desc:"Early morning & twilight add +1–2 pts. Prime time (10am–2pm) subtracts 2."},
                {icon:"📅",title:"Day of Week",   desc:"Tue–Thu get +1. Weekends lose 2. Off-peak months (Nov–Feb) add 1."},
                {icon:"🎯",title:"Slot Availability",desc:"Empty foursomes score higher. Single-player-available times score highest."},
                {icon:"⏱", title:"Booking Window",desc:"Last-minute openings within 24h score +1 — signals low demand."},
                {icon:"🏌️",title:"Course Type",   desc:"Municipal, harder, pricier, and walkable courses tend to be less crowded."},
                {icon:"📊",title:"Final Score",   desc:"1–10 scale. 8+ means high probability of playing alone. All factors combined."},
              ].map(({icon,title,desc})=>(
                <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                  <div>
                    <div style={{color:C.text,fontWeight:500,fontSize:13,marginBottom:4}}>{title}</div>
                    <div style={{color:C.textDim,fontSize:11,lineHeight:1.55,fontFamily:"monospace"}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{textAlign:"center",marginTop:48,color:C.textDim,fontFamily:"monospace",fontSize:10,letterSpacing:"0.1em"}}>
          GOLF ALONE · Maximize solo round probability · Demo with simulated data
        </div>
      </div>
    </div>
  );
}
