/* ═══════════════════════════════════════════════
   CALC — محرّك الحسابات
   ═══════════════════════════════════════════════ */
window.Calc = (function(){

  /**
   * اختيار مواصفة العرق المناسبة حسب طول العرق
   * آمن حتى لو كانت المواصفات فارغة أو غير صالحة
   */
  function pickBeamSpec(beamLength, specs){
    // لو لا توجد مواصفات → ارجع كائن افتراضي (حتى لا تنكسر الحسابات)
    if(!specs || !specs.length){
      return { height: 0, width: 0, price: 0, fromLen: 0, toLen: Infinity };
    }

    const sorted = [...specs].sort((a,b) => (Number(a.fromLen)||0) - (Number(b.fromLen)||0));

    for(const s of sorted){
      const from = Number(s.fromLen) || 0;
      const to   = (s.toLen == null || s.toLen === '' || Number(s.toLen) === 0)
                   ? Infinity
                   : Number(s.toLen);
      if(beamLength >= from && beamLength <= to){
        return s;
      }
    }
    // لو الطول أكبر من كل النطاقات → أعلى مواصفة
    return sorted[sorted.length - 1];
  }

  /**
   * حساب سقف واحد
   */
  function calcCeiling(c, beamSpecs, plankSpec){
    const D = Number(c.length) || 0;   // طول الغرفة (سم)
    const E = Number(c.width)  || 0;   // عرض الغرفة (سم)

    // ── المعادلات الأساسية ──
    const F = Math.round(D / 50);                          // عدد العروق
    const G = Math.ceil((E + 20) / 30) * 30;               // طول العرق (سم)
    const H = Math.ceil(E / 9) + 1;                        // عدد الألواح
    const K = Math.ceil((D + 15) / 30) * 30;               // إجمالي طول الألواح الكلي
    const I = K < 480 ? K : K - 300;                       // طول اللوح الفعلي
    const J = (K - I === 0) ? null : K - I;                // طول الوصلة

    // ── اختيار مواصفة العرق تلقائياً حسب الطول G ──
    const beam = pickBeamSpec(G, beamSpecs);
    const beamH = beam ? Number(beam.height) || 0 : 0;
    const beamW = beam ? Number(beam.width)  || 0 : 0;
    const beamPrice = beam ? Number(beam.price) || 0 : 0;
    const beamArea = beamH * beamW;

    // ── تكعيب العروق ──
    const L = F * G * beamArea / 1e6;

    // ── تكعيب الألواح ──
    const pW = Number(plankSpec?.width) || 0;
    const pT = Number(plankSpec?.thickness) || 0;
    const pPrice = Number(plankSpec?.price) || 0;
    const plankArea = pW * pT / 100;
    const M = K * H * plankArea / 1e6;

    // ── التكاليف ──
    const beamCost  = L * beamPrice;
    const plankCost = M * pPrice;
    const totalCost = beamCost + plankCost;

    return {
      id: c.id, code: c.code || '', name: c.name, D, E,
      F, G, beam, beamH, beamW, beamPrice, beamArea,
      L, beamCost,
      H, I, J, K,
      pW, pT, pPrice, plankArea,
      M, plankCost,
      totalCost
    };
  }

  function calcAll(cases, beamSpecs, plankSpec){
    return (cases || []).map(c => calcCeiling(c, beamSpecs, plankSpec));
  }

  /**
   * تجميع الحالات حسب الكود أو الاسم
   */
  function groupCases(cases){
    const map = new Map();
    (cases || []).forEach(c => {
      const code = (c.code || '').trim();
      const name = (c.name || '').trim();
      const key  = code ? ('C:' + code.toLowerCase()) : ('N:' + name.toLowerCase());
      if(!map.has(key)){
        map.set(key, { code, name, ceilings: [] });
      }
      const g = map.get(key);
      if(code && !g.code) g.code = code;
      if(name && !g.name) g.name = name;
      g.ceilings.push(c);
    });
    return [...map.values()];
  }

  /**
   * إجماليات الطلبية
   */
  function buildOrder(calcs, plankSpec){
    const beams = {};
    const planks = {};

    let totalBeamVol = 0, totalPlankVol = 0;
    let totalBeamCost = 0, totalPlankCost = 0;
    let totalBeamCount = 0, totalPlankCount = 0;
    let totalJointCount = 0, totalJointLen = 0;

    calcs.forEach(r => {
      // ── العروق ──
      if(r.beamH && r.beamW && r.G >= 100){
        const key = `${r.beamH}×${r.beamW}@${r.beamPrice}`;
        if(!beams[key]){
          beams[key] = {
            height: r.beamH, width: r.beamW, price: r.beamPrice,
            lengths: {}, totalQty: 0, totalVol: 0, totalCost: 0
          };
        }
        beams[key].lengths[r.G] = (beams[key].lengths[r.G] || 0) + r.F;
        beams[key].totalQty += r.F;
        beams[key].totalVol += r.L;
        beams[key].totalCost += r.beamCost;
        totalBeamCount += r.F;
      }

      // ── الألواح (طول I) ──
      if(r.I >= 100){
        if(!planks[r.I]) planks[r.I] = { length: r.I, qty: 0, vol: 0, cost: 0 };
        planks[r.I].qty += r.H;
        planks[r.I].vol += r.M;
        planks[r.I].cost += r.plankCost;
        totalPlankCount += r.H;
      }

      // ── وصلات (طول J) ──
      if(r.J && r.J >= 100){
        if(!planks[r.J]) planks[r.J] = { length: r.J, qty: 0, vol: 0, cost: 0 };
        const jVol = r.J * r.H * r.plankArea / 1e6;
        planks[r.J].qty += r.H;
        planks[r.J].vol += jVol;
        planks[r.J].cost += jVol * r.pPrice;
        totalPlankCount += r.H;
        totalJointCount += r.H;
        totalJointLen += r.J;
      }

      totalBeamVol  += r.L;
      totalPlankVol += r.M;
      totalBeamCost += r.beamCost;
      totalPlankCost += r.plankCost;
    });

    return {
      beams, planks,
      totalBeamVol, totalPlankVol, totalVol: totalBeamVol + totalPlankVol,
      totalBeamCost, totalPlankCost, totalCost: totalBeamCost + totalPlankCost,
      totalBeamCount, totalPlankCount, totalJointCount, totalJointLen
    };
  }

  /**
   * حساب المجموعة — مجموع كل أسقفها
   */
  function calcGroup(group, beamSpecs, plankSpec){
    const ceilings = group.ceilings.map(c => calcCeiling(c, beamSpecs, plankSpec));

    const beamGroups = {};
    ceilings.forEach(r => {
      const specKey = `${r.beamH}×${r.beamW}`;
      if(!beamGroups[specKey]){
        beamGroups[specKey] = { height: r.beamH, width: r.beamW, lengths: {} };
      }
      beamGroups[specKey].lengths[r.G] = (beamGroups[specKey].lengths[r.G] || 0) + r.F;
    });

    const plankLens = {};
    const jointLens = {};
    let totalBeamQty = 0, totalPlankQty = 0, totalJointQty = 0;

    ceilings.forEach(r => {
      totalBeamQty += r.F;
      if(r.I >= 100) plankLens[r.I] = (plankLens[r.I] || 0) + r.H;
      if(r.J && r.J >= 100){
        jointLens[r.J] = (jointLens[r.J] || 0) + r.H;
        totalJointQty += r.H;
      }
      if(r.I >= 100) totalPlankQty += r.H;
    });

    return {
      code: group.code,
      name: group.name,
      count: group.ceilings.length,
      ceilings,
      beamGroups, plankLens, jointLens,
      totalBeamQty, totalPlankQty, totalJointQty
    };
  }

  return {
    pickBeamSpec, calcCeiling, calcAll,
    groupCases, buildOrder, calcGroup
  };
})();