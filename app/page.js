'use client';
import { useState, useRef, useCallback } from 'react';

// === PRESETLER VE KANAL TANIMLARI ===
const DMX = {
  serviceUUID: "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
  charUUID: "beb5483e-36e1-4688-b7f5-ea07361b26a8",
  channels: { pan: 1, panFine: 2, tilt: 3, tiltFine: 4, color: 5, shape: 6, strobe: 7, dimmer: 8, smooth: 9, auto: 10, ring: 12 }
};

const PRESETS = {
  color: [{label:"Mavi",v:0},{label:"Sarı",v:15},{label:"Turuncu",v:25},{label:"Turkuaz",v:35},{label:"Pembe",v:45},{label:"Beyaz",v:55},{label:"Kırmızı",v:65},{label:"Yeşil",v:75},{label:"Akar",v:200}],
  shape: [{label:"Düz",v:0},{label:"Şekil 1",v:12},{label:"Titre 1",v:75},{label:"Titre 2",v:83},{label:"Akar",v:200}],
  auto: [{label:"Manuel",v:0},{label:"Auto 1",v:80},{label:"Auto 2",v:130},{label:"Ses",v:200}],
  ring: [{label:"Kapalı",v:0},{label:"Renk 1",v:20},{label:"Gökkuşağı",v:150}]
};

export default function DmxRemote() {
  const [status, setStatus] = useState('Bağlantı Yok');
  const [isConnected, setIsConnected] = useState(false);
  const [tab, setTab] = useState('MOTION');
  const charRef = useRef(null);
  const lastSent = useRef({});

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

  const send = useCallback(async (ch, val) => {
    if (!charRef.current) return;
    const now = Date.now();
    if (now - (lastSent.current[ch] || 0) < 30) return;
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
      <div style={{flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', opacity: !isConnected ? 0.3 : 1, pointerEvents: !isConnected ? 'none' : 'auto'}}>
        {tab === 'MOTION' && (
          <>
            <Slider label="PAN" ch={DMX.channels.pan} send={send} />
            <Slider label="TILT" ch={DMX.channels.tilt} send={send} />
          </>
        )}
        {tab === 'VISUALS' && (
          <>
            <Dropdown label="RENK" items={PRESETS.color} ch={DMX.channels.color} send={send} />
            <Slider label="DIMMER" ch={DMX.channels.dimmer} send={send} def={255} />
            <Slider label="STROBE" ch={DMX.channels.strobe} send={send} />
          </>
        )}
        {tab === 'AUTO' && (
          <>
            <Dropdown label="MODLAR" items={PRESETS.auto} ch={DMX.channels.auto} send={send} />
            <Dropdown label="RING" items={PRESETS.ring} ch={DMX.channels.ring} send={send} />
          </>
        )}
      </div>

      <div style={{padding: '24px', textAlign: 'center', opacity: 0.5}}>
        <span style={{fontSize: '10px', fontWeight: 'bold', letterSpacing: '4px', color: '#00D1FF'}}>DEVELOPARDUS</span>
      </div>
    </div>
  );
}

function Slider({ label, ch, send, def = 0 }) {
  return (
    <div style={{backgroundColor: '#161616', padding: '16px', borderRadius: '12px', border: '1px solid #2D2D2D'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
        <span style={{fontSize: '11px', fontWeight: 'bold', color: '#999'}}>{label}</span>
      </div>
      <input type="range" min="0" max="255" defaultValue={def} onChange={e => send(ch, parseInt(e.target.value))} style={{width: '100%', accentColor: '#00D1FF', cursor: 'pointer'}} />
    </div>
  );
}

function Dropdown({ label, items, ch, send }) {
  return (
    <div style={{backgroundColor: '#161616', padding: '16px', borderRadius: '12px', border: '1px solid #2D2D2D'}}>
      <span style={{fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '12px'}}>{label}</span>
      <select onChange={e => send(ch, parseInt(e.target.value))} style={{width: '100%', backgroundColor: '#2D2D2D', padding: '12px', borderRadius: '8px', fontSize: '14px', border: 'none', outline: 'none', color: 'white', cursor: 'pointer'}}>
        {items.map((item, i) => <option key={i} value={item.v}>{item.label}</option>)}
      </select>
    </div>
  );
}