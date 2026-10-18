
const bonoTable = {
  5:[0,0,0,0,0], 6:[0,0,0,0,0], 7:[0,0,0,0,0], 8:[0,0,0,0,0], 9:[0,0,0,0,0],
  10:[0,0.05,0.15,0.25,0.35], 11:[0,0.05,0.15,0.25,0.35], 12:[0,0.05,0.15,0.25,0.35],
  13:[0,0.05,0.15,0.25,0.35], 14:[0,0.05,0.15,0.25,0.35],
  15:[0,0.3,0.4,0.5,0.6], 16:[0,0.3,0.4,0.5,0.6], 17:[0,0.3,0.4,0.5,0.6],
  18:[0,0.3,0.4,0.5,0.6], 19:[0,0.3,0.4,0.5,0.6],
  20:[0,0.55,0.65,0.75,1.0], 21:[0,0.55,0.65,0.75,1.0], 22:[0,0.55,0.65,0.75,1.0],
  23:[0,0.55,0.65,0.75,1.0], 24:[0,0.55,0.65,0.75,1.0], 25:[0,0.55,0.65,0.75,1.0],
};
const thresholds = [0, 12000, 36000, 60000, 90000];
// Constantes fiscales 2025 (SMG diario zona A $278.80, UMA diaria $113.14, revaluación PLUS 4.21% anual)
const UMA_DIARIA = 113.14;
const TOPE151_BASE = 206367;  // 5 UMA's anuales (año 1); en el Excel este tope escala cada año con la inflación
const TOPE185_BASE = 152000;  // tope anual Art. 185; también escala cada año con la inflación (igual que en el Excel)
const PERIODOS = {"Mensual":12,"Trimestral":4,"Semestral":2,"Anual":1};
const N_YEARS = 25;
const SI_MESES = 18; // Saldo Inicial: primeros 18 meses

function bracketIndex(aportacionAnual){
  let idx=0;
  for(let i=0;i<thresholds.length;i++) if(aportacionAnual>=thresholds[i]) idx=i;
  return idx;
}
function pctBono(plazo, aportacionAnualBase){
  const p = Math.max(5, Math.min(25, Math.round(plazo)));
  const row = bonoTable[p] || bonoTable[25];
  return row[bracketIndex(aportacionAnualBase)];
}

function bracketIndex(aportacionAnual){
  let idx=0;
  for(let i=0;i<thresholds.length;i++) if(aportacionAnual>=thresholds[i]) idx=i;
  return idx;
}
function pctBono(plazo, aportacionAnualBase){
  const p = Math.max(5, Math.min(25, Math.round(plazo)));
  const row = bonoTable[p] || bonoTable[25];
  return row[bracketIndex(aportacionAnualBase)];
}

function simulate(inputs, totalYears){
  const {edadActual, tipoPlan, plazo, periodicidad, isrPct, tasaRendimiento, inflacion, udiValor, overrides} = inputs;
  const nY = totalYears || N_YEARS;
  const tasaMensual = Math.pow(1+tasaRendimiento,1/12)-1;
  // Tasa del Bono de Fidelidad: CETE + 5% anual garantizado, topado a 9% anual. El simulador proyecta con el tope de 9%.
  const tasaBonoAnual = 0.09;
  const tasaBonoMensual = Math.pow(1+tasaBonoAnual,1/12)-1;
  const iva = tipoPlan==="No Deducible 93" ? 1 : 1.16;
  const pagosPorAno = PERIODOS[periodicidad];

  const aplicada=[];
  for(let y=0;y<nY;y++){
    if(y===0) aplicada.push(overrides[0] ?? 0);
    else{
      const ov = (y<overrides.length) ? overrides[y] : null;
      aplicada.push((ov!==null && ov!==undefined) ? ov : aplicada[y-1]*(1+inflacion));
    }
  }
  const aportacionAnual = aplicada.map(a=>a); // "aplicada" ya representa el monto ANUAL (Inversión Anual)
  const aportacionAcumulada=[];
  aportacionAnual.forEach((v,i)=>aportacionAcumulada.push(i===0? v : aportacionAcumulada[i-1]+v));

  const pctB = pctBono(plazo, aportacionAnual[0]);

  let SI=0, SC=0, P=0; // Saldo Inicial (meses 1-18), Saldo Comprometido (mes 19+), Saldo de Bono
  const anual=[];
  for(let y=1;y<=nY;y++){
    for(let m=1;m<=12;m++){
      const numMesGlobal=(y-1)*12+m;
      const enSI = numMesGlobal<=SI_MESES;
      const paga = periodicidad==="Mensual" ? true :
        periodicidad==="Trimestral" ? ((m-1)%3===0) :
        periodicidad==="Semestral" ? ((m-1)%6===0) : (m===1);
      const E = paga ? aplicada[y-1]/pagosPorAno : 0;

      const E_SI = enSI ? E : 0;
      const E_SC = enSI ? 0 : E;

      // Saldo Inicial: recibe aportaciones solo durante los primeros 18 meses, pero sigue
      // vivo y pagando sus propios cargos (Gestión 0.1% mensual + Administración 1.5%
      // trimestral) mientras la póliza esté en vigor, tal como marcan las Condiciones
      // Generales ("Cargo Administrativo: hasta 1.5% trimestral... sobre el Fondo
      // Individual en Administración Inicial").
      {
        const F = SI;
        const interes = (F+E_SI)*tasaMensual;
        const cargoFijoInicial = numMesGlobal===1 ? -500 : 0;
        const cargoAdmin = (numMesGlobal%3===0) ? -(F+E_SI+interes+cargoFijoInicial)*0.015*iva : 0;
        const cargoGestion = -(F+E_SI+interes+cargoFijoInicial+cargoAdmin)*0.001*iva;
        SI = F+E_SI+interes+cargoFijoInicial+cargoAdmin+cargoGestion;
      }
      // Saldo Comprometido (mes 19+): recibe las aportaciones una vez terminado el Plazo
      // Inicial; paga Gestión 0.1% mensual + Cargo Fijo de 25 UDIS al mes (unificado para
      // los tres artículos, conforme a las versiones vigentes de las Condiciones Generales).
      if(!enSI){
        const F = SC;
        const interes = (F+E_SC)*tasaMensual;
        const cargoFijoUDI = -25*udiValor;
        const cargoGestion = -(F+E_SC+interes+cargoFijoUDI)*0.001*iva;
        SC = F+E_SC+interes+cargoFijoUDI+cargoGestion;
      }

      // Bono de Fidelidad: propia tasa (inflación+5%, tope 9%), mismos cargos que Saldo Inicial.
      // El bono se calcula ÚNICAMENTE sobre las aportaciones del primer año (meses 1-12): a
      // partir del mes 13 ya no entran nuevas aportaciones al bono, aunque su saldo sigue
      // generando interés y pagando sus propios cargos como cualquier otro año.
      const bonoDelMes = (numMesGlobal<=12) ? E*pctB : 0;
      const Fb = P;
      const interesBono = (Fb+bonoDelMes)*tasaBonoMensual;
      const cargoAdminBono = (numMesGlobal%3===0) ? -(Fb+bonoDelMes+interesBono)*0.015 : 0;
      const cargoGestionBono = -(Fb+bonoDelMes+interesBono+cargoAdminBono)*0.001;
      P = Fb+bonoDelMes+interesBono+cargoAdminBono+cargoGestionBono;
    }
    const edad = edadActual+y;
    const saldoAlVencer = SI+SC+P; // valor total si se cumple el plazo comprometido y el esquema de aportaciones
    // Antes de cumplir el plazo comprometido, el Saldo Inicial (meses 1-18) y el Bono de Fidelidad
    // NO son líquidos: solo el Saldo Comprometido lo es (igual que Resumen!O en el Excel).
    // Al cumplirse el plazo comprometido, TODO el fondo se libera (Saldo Inicial + Saldo Comprometido + Bono).
    const saldoDisponible = (y>=plazo) ? saldoAlVencer : SC;
    let tope=0;
    if(tipoPlan==="Deducible 151") tope=TOPE151_BASE*Math.pow(1+inflacion,y-1);
    else if(tipoPlan==="Deducible 185") tope=TOPE185_BASE*Math.pow(1+inflacion,y-1);
    const beneficioAno = tipoPlan==="No Deducible 93" ? 0 : Math.min(aportacionAnual[y-1],tope)*isrPct;
    anual.push({ano:y, edad, aportacionAnual:aportacionAnual[y-1], aportacionAcumulada:aportacionAcumulada[y-1],
      saldoDisponible, saldoBono:P, saldoTotal:saldoAlVencer, beneficioAno, aplicada:aplicada[y-1],
      isOverride: overrides[y-1]!==null && overrides[y-1]!==undefined, cumplioPlazo: y>=plazo});
  }
  let benAcum=0, benAcumSimple=0;
  anual.forEach(row=>{
    benAcum = row.beneficioAno + benAcum*(1+tasaRendimiento); // reinvertido a la tasa de rendimiento (para la corrida/tabla)
    benAcumSimple += row.beneficioAno; // suma simple año con año, SIN reinversión (para la tarjeta KPI)
    row.beneficioAcumulado = benAcum;
    row.beneficioAcumuladoSimple = benAcumSimple;
  });
  anual.forEach(row=>{
    // Saldo Neto Estimado post-ISR, según reglas exactas por artículo.
    // Exención fiscal total: se cumple SOLO cuando se cumplen AMBOS filtros a la vez:
    //   1) Edad mínima que marca la ley (60 años Art. 93 | 65 años Art. 151 y 185)
    //   2) Mínimo 5 años de permanencia dentro del plan
    // Al cumplirse ambos, el Saldo Neto = Saldo Disponible (100% libre de impuestos), y solo se
    // descuenta el 1% de comisión por retiro anticipado si aún no se cumple el plazo comprometido.
    const edadMinimaLey = tipoPlan==="No Deducible 93" ? 60 : 65;
    // Exención total: SOLO aplica a Art. 93 y Art. 151 (exención tipo pensión, art. 93 LISR).
    // El Art. 185 NUNCA es libre de impuestos: por ley, todo lo retirado se acumula como
    // ingreso ordinario del año, topado únicamente a la tasa marginal que tenía el cliente
    // en el año en que hizo la aportación (no hay monto exento).
    const exentoTotal = tipoPlan!=="Deducible 185" && row.edad>=edadMinimaLey && row.ano>=5;
    let neto;
    if(exentoTotal){
      neto = row.cumplioPlazo ? row.saldoDisponible : row.saldoDisponible*0.99;
    } else if(tipoPlan==="No Deducible 93"){
      // Antes de cumplir ambos filtros: 20% sobre el interés real (base: Saldo Disponible).
      neto = row.saldoDisponible - 0.20*Math.max(0,row.saldoDisponible-row.aportacionAcumulada);
    } else if(tipoPlan==="Deducible 151"){
      // Antes de cumplir ambos filtros: Saldo Disponible*0.80 (Fórmula exacta del Excel, Resumen!Q)
      neto = row.saldoDisponible*0.80;
    } else {
      neto = row.saldoDisponible*0.65; // Art. 185: tasa máxima vigente 35% antes de cumplir ambos filtros
    }
    row.saldoNeto=neto;
  });
  return anual;
}


if(typeof module!=="undefined")module.exports={simulate,pctBono};
