'use client';
import { useState, useRef, useCallback } from 'react';

// === PRESETLER VE KANAL TANIMLARI (Swift ile senkron) ===
const DMX = {
  serviceUUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
  charUUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
  channels: { 
    pan: 1, panFine: 2, tilt: 3, tiltFine: 4, color: 5, shape: 6, 
    strobe: 7, dimmer: 8, smooth: 9, auto: 10, ring: 12 
  }
};

const PRESETS = {
  color: [
    {label:"Mavi",v:0},{label:"Sarı",v:15},{label:"Turuncu",v:25},{label:"Turkuaz",v:35},
    {label:"Pembe",v:45},{label:"Beyaz",v:55},{label:"Kırmızı",v:65},{label:"Yeşil",v:75},
    {label:"Kirm-Yeş",v:85},{label:"Beyz-Kirm",v:95},{label:"Pemb-Beyz",v:105},{label:"Turk-Pemb",v:115},
    {label:"Turun-Turk",v:125},{label:"Sarı-Turun",v:135},{label:"RAINBOW",v:200}
  ],
  shape: [
    {label:"Düz",v:0},{label:"Şekil 1",v:12},{label:"Şekil 2",v:35},{label:"Şekil 3",v:43},
    {label:"Şekil 4",v:52},{label:"Şekil 5",v:60},{label:"Düz 2",v:68},{label:"Titre 1",v:75},
    {label:"Titre 2",v:83},{label:"Titre 3",v:91},{label:"Titre 4",v:99},{label:"Titre 5",v:107},
    {label:"Titre 6",v:115},{label:"Titre 7",v:124},{label:"AKAR",v:200}
  ],
  auto: [
    {label:"Manuel",v:0},{label:"Auto 1",v:80},{label:"Auto 2",v:145},{label:"Auto 3",v:180}
  ],
  ring: [
    {label:"Kapalı",v:0},{label:"Kırmızı",v:12},{label:"Yeşil",v:27},{label:"Mavi",v:42},
    {label:"Sarı",v:57},{label:"Pembe",v:72},{label:"Beyaz",v:95},{label:"Değişken",v:113},
    {label:"RAINBOW",v:250}
  ]
};

export default function DmxRemote() {
  const [status, setStatus] = useState('Bağlantı Yok');
  const [isConnected, setIsConnected] = useState(false);
  const [tab, setTab] = useState('MOTION');
  
  // Channel state'leri
  const [pan, setPan] = useState(0);
  const [panFine, setPanFine] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [tiltFine, setTiltFine] = useState(0);
  const [dimmer, setDimmer] = useState(255);
  const [strobe, setStrobe] = useState(0);
  const [smooth, setSmooth] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [shapeIdx, setShapeIdx] = useState(0);
  const [autoIdx, setAutoIdx] = useState(0);
  const [ringIdx, setRingIdx] = useState(0);
  
  const charRef = useRef(null);
  const lastSent = useRef({});
  const throttleInterval = 30; // ms (Swift versiyonu ile eşleştirildi)

  const connect = async () => {
    try {
      setStatus('Taranıyor...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'DMX_Gateway' }],
        optionalServices: [DMX.serviceUUID]
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(DMX.serviceUUID);
      charRef.current = await service.getCharacteristic(DMX.charUUID);
      setIsConnected(true);
      setStatus('Bağlandı');
      device.addEventListener('gattserverdisconnected', () => { setIsConnected(false); setStatus('Koptu'); });
    } catch (e) { setStatus('Hata!'); }
  };

  // Throttle mekanizması (30ms)
  const send = useCallback(async (ch, val) => {
    if (!charRef.current) return;
    const now = Date.now();
    if (now - (lastSent.current[ch] || 0) < throttleInterval) return;
    lastSent.current[ch] = now;
    try {
      await charRef.current.writeValueWithoutResponse(new Uint8Array([ch, val]));
    } catch (e) {}
  }, []);

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif'}}>
      {/* Sekme Çubuğu */}
      <div style={{display: 'flex', backgroundColor: '#161616', borderBottom: '1px solid #2D2D2D'}}>
        {['MOTION', 'VISUALS', 'AUTO'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1,
            padding: '16px 0',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            backgroundColor: 'transparent',
            color: tab === t ? '#00D1FF' : '#808080',
            border: 'none',
            borderBottom: tab === t ? '2px solid #00D1FF' : 'none',
            cursor: 'pointer'
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Bağlantı Durumu */}
      <div style={{padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0A0A0A'}}>
        <span style={{fontSize: '10px', color: '#808080', textTransform: 'uppercase', letterSpacing: '1px'}}>
          Durum: <span style={{color: isConnected ? '#22C55E' : '#EAB308'}}>{status}</span>
        </span>
        {!isConnected && (
          <button onClick={connect} style={{
            backgroundColor: '#00D1FF',
            color: 'black',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}>
            BAĞLAN
          </button>
        )}
      </div>

      {/* Kontroller */}
      <div style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', opacity: !isConnected ? 0.3 : 1, pointerEvents: !isConnected ? 'none' : 'auto'}}>
        {tab === 'MOTION' && (
          <>
            <Slider label="PAN (CH1)" ch={DMX.channels.pan} value={pan} onChange={(v)=>{setPan(v); send(DMX.channels.pan, v);}} />
            <Slider label="PAN FINE (CH2)" ch={DMX.channels.panFine} value={panFine} onChange={(v)=>{setPanFine(v); send(DMX.channels.panFine, v);}} />
            <Slider label="TILT (CH3)" ch={DMX.channels.tilt} value={tilt} onChange={(v)=>{setTilt(v); send(DMX.channels.tilt, v);}} />
            <Slider label="TILT FINE (CH4)" ch={DMX.channels.tiltFine} value={tiltFine} onChange={(v)=>{setTiltFine(v); send(DMX.channels.tiltFine, v);}} />
            <Slider label="SMOOTH (CH9)" ch={DMX.channels.smooth} value={smooth} onChange={(v)=>{setSmooth(v); send(DMX.channels.smooth, v);}} />
          </>
        )}
        {tab === 'VISUALS' && (
          <>
            <div style={{display: 'flex', gap: '12px'}}>
              <div style={{flex: 1}}>
                <Slider label="DIMMER (CH8)" ch={DMX.channels.dimmer} value={dimmer} onChange={(v)=>{setDimmer(v); send(DMX.channels.dimmer, v);}} def={255} />
              </div>
              <div style={{flex: 1}}>
                <Slider label="STROBE (CH7)" ch={DMX.channels.strobe} value={strobe} onChange={(v)=>{setStrobe(v); send(DMX.channels.strobe, v);}} />
              </div>
            </div>
            <div style={{display: 'flex', gap: '12px'}}>
              <div style={{flex: 1}}>
                <Dropdown label="RENK (CH5)" items={PRESETS.color} idx={colorIdx} onChange={(i)=>{setColorIdx(i); send(DMX.channels.color, PRESETS.color[i].v);}} />
              </div>
              <div style={{flex: 1}}>
                <Dropdown label="GOBO (CH6)" items={PRESETS.shape} idx={shapeIdx} onChange={(i)=>{setShapeIdx(i); send(DMX.channels.shape, PRESETS.shape[i].v);}} />
              </div>
            </div>
            <p style={{fontSize: '12px', color: '#808080', margin: '8px 0'}}>Renk + Gobo kombinasyonlarını deneyin</p>
          </>
        )}
        {tab === 'AUTO' && (
          <>
            <div style={{display: 'flex', gap: '12px'}}>
              <div style={{flex: 1}}>
                <Dropdown label="OTO MOD (CH10)" items={PRESETS.auto} idx={autoIdx} onChange={(i)=>{setAutoIdx(i); send(DMX.channels.auto, PRESETS.auto[i].v);}} />
              </div>
              <div style={{flex: 1}}>
                <Dropdown label="LED RING (CH12)" items={PRESETS.ring} idx={ringIdx} onChange={(i)=>{setRingIdx(i); send(DMX.channels.ring, PRESETS.ring[i].v);}} />
              </div>
            </div>
            <div style={{padding: '16px', backgroundColor: '#161616', borderRadius: '8px', fontSize: '12px', color: '#999', border: '1px solid #2D2D2D'}}>
              <p><strong>OTO MOD:</strong> Fixture'ın dahili programını başlatır. Manuel dışındaki modlarda PAN/TILT etkisiz olabilir.</p>
              <p><strong>LED RING:</strong> Fixture çevresindeki halka rengi. RAINBOW = sürekli renk değişimi.</p>
            </div>
          </>
        )}
      </div>

      <div style={{padding: '24px', textAlign: 'center', opacity: 0.5}}>
        <span style={{fontSize: '10px', fontWeight: 'bold', letterSpacing: '4px', color: '#00D1FF'}}>DEVELOPARDUS</span>
      </div>
    </div>
  );
}

function Slider({ label, ch, value, onChange, def = 0 }) {
  return (
    <div style={{backgroundColor: '#161616', padding: '12px', borderRadius: '8px', border: '1px solid #2D2D2D'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center'}}>
        <span style={{fontSize: '11px', fontWeight: 'bold', color: '#999'}}>{label}</span>
        <span style={{fontSize: '11px', fontWeight: 'bold', color: '#00D1FF', fontFamily: 'monospace'}}>{Math.round(value)}</span>
      </div>
      <input type="range" min="0" max="255" value={value} onChange={e => onChange(parseInt(e.target.value))} style={{width: '100%', accentColor: '#00D1FF', cursor: 'pointer'}} />
    </div>
  );
}

function Dropdown({ label, items, idx, onChange }) {
  return (
    <div style={{backgroundColor: '#161616', padding: '12px', borderRadius: '8px', border: '1px solid #2D2D2D'}}>
      <span style={{fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '8px'}}>{label}</span>
      <select value={idx} onChange={e => onChange(parseInt(e.target.value))} style={{width: '100%', backgroundColor: '#2D2D2D', padding: '8px', borderRadius: '6px', fontSize: '12px', border: 'none', outline: 'none', color: 'white', cursor: 'pointer'}}>
        {items.map((item, i) => <option key={i} value={i}>{item.label}</option>)}
      </select>
    </div>
  );
}