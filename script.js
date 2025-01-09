function calcularRescisao() {
  const tipoDemissao = document.getElementById("tipoDemissao").value;
  const dataAdmissao = new Date(document.getElementById("dataAdmissao").value);
  const dataDemissao = new Date(document.getElementById("dataDemissao").value);
  const ultimoSalario = parseFloat(
    document.getElementById("ultimoSalario").value
  );
  let avisoPrevio = document.getElementById("avisoPrevio")
    ? document.getElementById("avisoPrevio").value
    : null;
  let ultimoDiaTrabalhado;
  let feriasVencidas = document.getElementById("feriasVencidas").value;
  let periodosAquisitivosString = document.getElementById("periodosAquisitivos")
    ? document.getElementById("periodosAquisitivos").value
    : "";
  const periodosAquisitivos = periodosAquisitivosString
    .split(",")
    .map((periodo) => periodo.trim())
    .filter((periodo) => periodo !== "");
  const saldoFgts = document.getElementById("saldoFgts")
    ? parseFloat(document.getElementById("saldoFgts").value)
    : 0;
  const adiantamentos = document.getElementById("adiantamentos")
    ? parseFloat(document.getElementById("adiantamentos").value)
    : 0;
  const outrosDescontos = document.getElementById("outrosDescontos")
    ? parseFloat(document.getElementById("outrosDescontos").value)
    : 0;
  if (tipoDemissao === "pedido_demissao") {
    avisoPrevio = document.getElementById("avisoPrevio").value;
    ultimoDiaTrabalhado = dataDemissao;
  } else if (avisoPrevio === "cumprido") {
    ultimoDiaTrabalhado = new Date(
      document.getElementById("ultimoDiaTrabalhado").value
    );
  } else {
    ultimoDiaTrabalhado = dataDemissao;
  }
  if (tipoDemissao !== "pedido_demissao" && avisoPrevio != null) {
    ultimoDiaTrabalhado = ultimoDiaTrabalhado;
  }
  if (
    isNaN(ultimoSalario) ||
    dataAdmissao == "Invalid Date" ||
    dataDemissao == "Invalid Date"
  ) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }
  document.getElementById("loading-overlay").style.display = "flex";
  document.getElementById("loading").style.display = "flex";
  document.getElementById("resultado").style.display = "none";
  setTimeout(() => {
    const resultadoCalculo = calcularVerbasRescisorias({
      tipoDemissao,
      dataAdmissao,
      dataDemissao,
      ultimoSalario,
      avisoPrevio,
      ultimoDiaTrabalhado,
      feriasVencidas,
      periodosAquisitivos,
      saldoFgts,
      adiantamentos,
      outrosDescontos,
    });
    mostrarResultado(resultadoCalculo);
    document.getElementById("loading-overlay").style.display = "none";
    document.getElementById("loading").style.display = "none";
    document.getElementById("resultado").style.display = "block";
    document.getElementById("resultado").scrollIntoView({ behavior: "smooth" });
  }, Math.random() * 2000 + 3000);
}

function calcularVerbasRescisorias(dados) {
  const {
    tipoDemissao,
    dataAdmissao,
    dataDemissao,
    ultimoSalario,
    avisoPrevio,
    ultimoDiaTrabalhado,
    feriasVencidas,
    periodosAquisitivos,
    saldoFgts,
    adiantamentos,
    outrosDescontos,
  } = dados;
  let verbas = [];
  let totalVerbas = 0;
  let totalMultaFgts = 0;
  const diffInDays = Math.ceil(
    (dataDemissao - dataAdmissao) / (1000 * 60 * 60 * 24)
  );
  const anosTrabalhados = diffInDays / 365;
  let diasAvisoPrevio = 30 + Math.min(Math.floor(anosTrabalhados) * 3, 60);
  let dataFinalContrato = new Date(dataDemissao);
  if (tipoDemissao === "sem_justa_causa" && avisoPrevio === "cumprido") {
    dataFinalContrato = new Date(ultimoDiaTrabalhado);
  }
  const calcularSaldoSalario = () => {
    let diasTrabalhados;
    if (tipoDemissao === "pedido_demissao") {
      diasTrabalhados = dataDemissao.getDate();
    } else if (
      tipoDemissao === "com_justa_causa" ||
      tipoDemissao === "rescisao_reciproca"
    ) {
      diasTrabalhados = dataDemissao.getDate();
    } else {
      diasTrabalhados = ultimoDiaTrabalhado ? ultimoDiaTrabalhado.getDate() : 0;
    }
    const valorSaldo =
      isNaN(ultimoSalario) || isNaN(diasTrabalhados)
        ? 0
        : (ultimoSalario / 30) * diasTrabalhados;
    verbas.push({ verba: "Saldo de Salário", valor: valorSaldo });
    totalVerbas += valorSaldo;
  };
  const calcularAvisoPrevio = () => {
    if (tipoDemissao === "sem_justa_causa") {
      if (avisoPrevio === "indenizado") {
        let valorAviso = ultimoSalario * (diasAvisoPrevio / 30);
        verbas.push({ verba: "Aviso Prévio Indenizado", valor: valorAviso });
        totalVerbas += valorAviso;
        const valorProjecaoFerias = ultimoSalario / 12 + ultimoSalario / 12 / 3;
        verbas.push({
          verba: "Projeção Férias 1/12 Avos",
          valor: valorProjecaoFerias,
        });
        totalVerbas += valorProjecaoFerias;
        const valorProjecaoDecimoTerceiro = ultimoSalario / 12;
        verbas.push({
          verba: "Projeção 13º Salário",
          valor: valorProjecaoDecimoTerceiro,
        });
        totalVerbas += valorProjecaoDecimoTerceiro;
      }
    } else if (tipoDemissao === "rescisao_reciproca") {
      let valorAviso = (ultimoSalario * (diasAvisoPrevio / 30)) / 2;
      verbas.push({ verba: "Aviso Prévio", valor: valorAviso });
      totalVerbas += valorAviso;
      const valorProjecaoFerias = ultimoSalario / 12 + ultimoSalario / 12 / 3;
      verbas.push({
        verba: "Projeção Férias 1/12 Avos",
        valor: valorProjecaoFerias,
      });
      totalVerbas += valorProjecaoFerias;
      const valorProjecaoDecimoTerceiro = ultimoSalario / 12;
      verbas.push({
        verba: "Projeção 13º Salário",
        valor: valorProjecaoDecimoTerceiro,
      });
      totalVerbas += valorProjecaoDecimoTerceiro;
    } else if (tipoDemissao === "pedido_demissao") {
      if (avisoPrevio === "nao_cumprido") {
        let valorAviso = ultimoSalario;
        verbas.push({ verba: "Desconto Aviso Prévio", valor: -valorAviso });
        totalVerbas -= valorAviso;
      }
    } else if (tipoDemissao === "com_justa_causa") {
      let valorAviso = ultimoSalario;
      verbas.push({ verba: "Desconto Aviso Prévio", valor: -valorAviso });
      totalVerbas -= valorAviso;
    }
  };
  const calcularFerias = () => {
    let feriasVencidasTotal = 0;
    if (feriasVencidas === "sim" && periodosAquisitivos.length > 0) {
      periodosAquisitivos.forEach((periodo) => {
        const dataInicioAquisitivo = new Date(periodo.split("-")[0]);
        const dataFimAquisitivo = new Date(periodo.split("-")[1]);
        const dataFimConcessivo = new Date(dataFimAquisitivo);
        dataFimConcessivo.setFullYear(dataFimConcessivo.getFullYear() + 1);
        let valorFerias = ultimoSalario + ultimoSalario / 3;
        let feriasDobrada = false;
        if (dataDemissao > dataFimConcessivo) {
          valorFerias *= 2;
          feriasDobrada = true;
        }
        verbas.push({
          verba: `Férias Vencidas ${periodo} ${feriasDobrada ? "(Dobro)" : ""}`,
          valor: valorFerias,
        });
        feriasVencidasTotal += valorFerias;
      });
      totalVerbas += feriasVencidasTotal;
    }

    let mesesTrabalhados = 0;
    let proporcional = 0;
    let valorFeriasProp = 0;

    if (
      (tipoDemissao === "sem_justa_causa" && avisoPrevio === "indenizado") ||
      tipoDemissao === "rescisao_reciproca" ||
      tipoDemissao === "pedido_demissao"
    ) {
      const diffInMonths =
        (dataDemissao.getFullYear() - dataAdmissao.getFullYear()) * 12 +
        (dataDemissao.getMonth() - dataAdmissao.getMonth());
      mesesTrabalhados = diffInMonths;
      const diaDemissao = dataDemissao.getDate();
      if (diaDemissao >= 15) {
        mesesTrabalhados++;
      }
      if (mesesTrabalhados > 12) {
        mesesTrabalhados = 12;
      }
      proporcional = (ultimoSalario / 12) * mesesTrabalhados;
      valorFeriasProp = proporcional + proporcional / 3;
    } else if (
      tipoDemissao === "sem_justa_causa" &&
      avisoPrevio === "cumprido"
    ) {
      const diffInMonths =
        (ultimoDiaTrabalhado.getFullYear() - dataAdmissao.getFullYear()) * 12 +
        (ultimoDiaTrabalhado.getMonth() - dataAdmissao.getMonth());
      mesesTrabalhados = diffInMonths;
      const diaDemissao = ultimoDiaTrabalhado.getDate();
      if (diaDemissao >= 15) {
        mesesTrabalhados++;
      }
      proporcional = (ultimoSalario / 12) * mesesTrabalhados;
      valorFeriasProp = proporcional + proporcional / 3;
    } else if (tipoDemissao === "com_justa_causa") {
      const diffInMonths =
        (dataDemissao.getFullYear() - dataAdmissao.getFullYear()) * 12 +
        (dataDemissao.getMonth() - dataAdmissao.getMonth());
      mesesTrabalhados = diffInMonths;
      const diaDemissao = dataDemissao.getDate();
      if (diaDemissao >= 15) {
        mesesTrabalhados++;
      }
      if (mesesTrabalhados > 12) {
        mesesTrabalhados = 12;
      }
      proporcional = (ultimoSalario / 12) * mesesTrabalhados;
      valorFeriasProp = proporcional + proporcional / 3;
    }
    if (
      tipoDemissao === "sem_justa_causa" ||
      tipoDemissao === "rescisao_reciproca" ||
      tipoDemissao === "pedido_demissao"
    ) {
      verbas.push({
        verba: "Férias Proporcionais + 1/3",
        valor: valorFeriasProp,
      });
      totalVerbas += valorFeriasProp;
    } else if (tipoDemissao === "com_justa_causa") {
      verbas.push({
        verba: "Férias Proporcionais + 1/3",
        valor: valorFeriasProp,
      });
      totalVerbas += valorFeriasProp;
    }
  };
  const calcularDecimoTerceiro = () => {
    let mesesTrabalhados = 0;

    // Verifica se o aviso prévio foi cumprido
    const avisoPrevioCumprido = avisoPrevio === "cumprido";

    // Data final para considerar no cálculo
    const dataFinal = new Date(dataFinalContrato); // Data final do contrato (incluindo aviso prévio se cumprido)
    if (avisoPrevioCumprido) {
      // Acrescenta um mês ao período de cálculo se o aviso for cumprido
      dataFinal.setMonth(dataFinal.getMonth() + 1);
    }

    // Calcula o 13º proporcional APENAS se a demissão NÃO for com justa causa
    if (tipoDemissao !== "com_justa_causa") {
      // Iterar sobre os meses desde a admissão até o final do contrato
      const dataIteracao = new Date(dataAdmissao);
      while (
        dataIteracao.getFullYear() < dataFinal.getFullYear() ||
        (dataIteracao.getFullYear() === dataFinal.getFullYear() &&
          dataIteracao.getMonth() <= dataFinal.getMonth())
      ) {
        // Verifica se o mês atual deve ser contabilizado
        if (
          dataIteracao.getFullYear() < dataFinal.getFullYear() ||
          (dataIteracao.getFullYear() === dataFinal.getFullYear() &&
            dataIteracao.getDate() >= 15)
        ) {
          mesesTrabalhados++;
        }

        // Avança para o próximo mês
        dataIteracao.setMonth(dataIteracao.getMonth() + 1);
      }

      if (mesesTrabalhados > 13) {
        mesesTrabalhados = 13; // Limita a 13/12 no máximo (12 meses completos + 1 mês pelo aviso prévio)
      }

      // Calcula o 13º proporcional
      const valorDecimoTerceiro = (ultimoSalario / 12) * mesesTrabalhados;

      // Adiciona o 13º proporcional às verbas rescisórias
      verbas.push({
        verba: `13º Salário Proporcional (${mesesTrabalhados}/12)`,
        valor: valorDecimoTerceiro,
      });

      // Atualiza o total das verbas rescisórias
      totalVerbas += valorDecimoTerceiro;
    }
  };
  const calcularMultaFgts = () => {
    if (tipoDemissao === "sem_justa_causa") {
      let multa = saldoFgts * 0.4;
      verbas.push({ verba: "Multa 40% FGTS", valor: multa });
      totalMultaFgts = multa;
    }
    if (tipoDemissao === "rescisao_reciproca") {
      let multa = saldoFgts * 0.2;
      verbas.push({ verba: "Multa 20% FGTS", valor: multa });
      totalMultaFgts = multa;
    }
  };
  const calcularTotalDescontos = (adiantamentos, outrosDescontos) => {
    return adiantamentos + outrosDescontos;
  };
  const calcularDescontos = () => {
    const inss = calcularINSS(ultimoSalario);
    const irrf = calcularIRRF(ultimoSalario, inss);
    verbas.push({ verba: "Desconto INSS", valor: -inss });
    verbas.push({ verba: "Desconto IRRF", valor: -irrf });

    const totalDescontosAdicionais = calcularTotalDescontos(
      adiantamentos,
      outrosDescontos
    );
    verbas.push({
      verba: "Descontos Diversos",
      valor: -totalDescontosAdicionais,
    });

    totalVerbas -= inss + irrf + totalDescontosAdicionais;
  };
  calcularSaldoSalario();
  calcularAvisoPrevio();
  calcularFerias();
  calcularDecimoTerceiro();
  calcularMultaFgts();
  calcularDescontos();
  return { verbas, totalVerbas, totalMultaFgts };
}
function mostrarResultado(resultado) {
  const resultadoTabela = document.querySelector("#resultadoTabela tbody");
  const totalVerbasRescisoriasElement = document.getElementById(
    "totalVerbasRescisorias"
  );
  const totalMultaFgtsElement = document.getElementById("totalMultaFgts");
  const totalGeralElement = document.getElementById("totalGeral");
  resultadoTabela.innerHTML = "";
  resultado.verbas.forEach((item) => {
    const row = document.createElement("tr");
    const verbaCell = document.createElement("td");
    const valorCell = document.createElement("td");
    verbaCell.textContent = item.verba;
    valorCell.textContent = item.valor.toFixed(2);
    row.appendChild(verbaCell);
    row.appendChild(valorCell);
    resultadoTabela.appendChild(row);
  });
  totalVerbasRescisoriasElement.textContent = `Total das Verbas Rescisórias: R$ ${resultado.totalVerbas.toFixed(
    2
  )}`;
  totalMultaFgtsElement.textContent = `Total da Multa do FGTS: R$ ${resultado.totalMultaFgts.toFixed(
    2
  )}`;
  let totalGeral = resultado.totalVerbas + resultado.totalMultaFgts;

  // Verifica se já existe um aviso e remove se existir
  const avisoExistente = document.querySelector(".aviso-rescisao-zerada");
  if (avisoExistente) {
    avisoExistente.remove();
  }
  if (totalGeral < 0) {
    const avisoParagrafo = document.createElement("p");
    avisoParagrafo.textContent =
      "* Em razão de valores negativos da rescisão, ela será zerada.";
    avisoParagrafo.classList.add("aviso-rescisao-zerada");
    totalGeralElement.parentNode.insertBefore(
      avisoParagrafo,
      totalGeralElement.nextSibling
    );
    totalGeral = 0;
  }
  totalGeralElement.textContent = `Total Geral: R$ ${totalGeral.toFixed(2)}`;
}
// Tabelas progressivas INSS e IRRF (atualizadas 2024)
function calcularINSS(salario) {
  const aliquotasINSS = [
    { faixa: 1412.0, aliquota: 0.075 },
    { faixa: 2666.68, aliquota: 0.09 },
    { faixa: 4000.03, aliquota: 0.12 },
    { faixa: 7786.02, aliquota: 0.14 },
  ];
  let inss = 0;
  let salarioRestante = salario;
  for (const faixa of aliquotasINSS) {
    if (salarioRestante > faixa.faixa) {
      inss += faixa.faixa * faixa.aliquota;
      salarioRestante -= faixa.faixa;
    } else {
      inss += salarioRestante * faixa.aliquota;
      break;
    }
  }
  return inss > 908.85 ? 908.85 : inss;
}
function calcularIRRF(salario, inss) {
  const baseCalculo = salario - inss;
  const aliquotasIRRF = [
    { faixa: 2259.2, aliquota: 0.0, deducao: 0.0 },
    { faixa: 2259.21, aliquota: 0.075, deducao: 169.44 },
    { faixa: 3751.05, aliquota: 0.15, deducao: 419.36 },
    { faixa: 4664.68, aliquota: 0.225, deducao: 779.8 },
    { faixa: Infinity, aliquota: 0.275, deducao: 973.19 },
  ];
  let irrf = 0;
  for (const faixa of aliquotasIRRF) {
    if (baseCalculo <= faixa.faixa) {
      irrf = baseCalculo * faixa.aliquota - faixa.deducao;
      break;
    }
  }
  return irrf > 0 ? irrf : 0;
}
document.getElementById("tipoDemissao").addEventListener("change", function () {
  const tipoDemissao = this.value;
  const avisoPrevioContainer = document.getElementById("avisoPrevioContainer");
  const ultimoDiaTrabalhadoContainer = document.getElementById(
    "ultimoDiaTrabalhadoContainer"
  );
  const feriasVencidasContainer = document.getElementById(
    "feriasVencidasContainer"
  );
  const saldoFgtsContainer = document.getElementById("saldoFgtsContainer");
  const avisoPrevioSelect = document.getElementById("avisoPrevio");
  if (tipoDemissao === "sem_justa_causa") {
    avisoPrevioContainer.style.display = "flex";
    saldoFgtsContainer.style.display = "flex";
    avisoPrevioSelect.innerHTML =
      '<option value="indenizado">Indenizado</option><option value="cumprido">Cumprido</option>';
  } else if (tipoDemissao === "rescisao_reciproca") {
    avisoPrevioContainer.style.display = "none";
    saldoFgtsContainer.style.display = "flex";
    avisoPrevio = "indenizado";
  } else if (tipoDemissao === "pedido_demissao") {
    avisoPrevioContainer.style.display = "flex";
    avisoPrevioSelect.innerHTML =
      '<option value="cumprido">Cumprido</option><option value="nao_cumprido">Não Cumprido</option>';
  } else if (tipoDemissao === "com_justa_causa") {
    avisoPrevioContainer.style.display = "none";
    saldoFgtsContainer.style.display = "none";
  }
  feriasVencidasContainer.style.display = tipoDemissao ? "flex" : "none";
  ultimoDiaTrabalhadoContainer.style.display = "none";
});
document.getElementById("avisoPrevio").addEventListener("change", function () {
  const avisoPrevio = this.value;
  const ultimoDiaTrabalhadoContainer = document.getElementById(
    "ultimoDiaTrabalhadoContainer"
  );
  if (
    avisoPrevio === "cumprido" &&
    document.getElementById("tipoDemissao").value !== "pedido_demissao"
  ) {
    ultimoDiaTrabalhadoContainer.style.display = "flex";
  } else {
    ultimoDiaTrabalhadoContainer.style.display = "none";
  }
});
document
  .getElementById("feriasVencidas")
  .addEventListener("change", function () {
    const feriasVencidas = this.value;
    const periodosAquisitivosContainer = document.getElementById(
      "periodosAquisitivosContainer"
    );
    if (feriasVencidas === "sim") {
      periodosAquisitivosContainer.style.display = "flex";
    } else {
      periodosAquisitivosContainer.style.display = "none";
    }
  });
