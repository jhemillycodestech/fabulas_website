// Constantes baseadas estritamente nas abas reais da sua imagem
const ABA_USUARIOS = 'Cadastro_Usuarios';
const ABA_LIVROS = 'Livros';
const ABA_FEEDBACK = 'Feedback';
const ABA_FINANCEIRO = 'Financeiro';
const ABA_METRICAS = 'Dashboard_Metricas';
const ABA_GENER_CUSTOM = 'Generos_Custom';

function doGet(e) {
  let visao = e && e.parameter && e.parameter.visao ? e.parameter.visao.toLowerCase() : 'autor';
  
  if (visao === 'leitor') {
    return HtmlService.createHtmlOutputFromFile('Leitor')
      .setTitle('Fábulas — Espaço do Leitor')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
  
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Fábulas — Escreva, Inspire, Floresça')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function getAppUrl() {
  return ScriptApp.getService().getUrl();
}
/**
 * GRAVA O NOVO GÊNERO DIRETAMENTE NA SUA ABA REAL 'Generos_Custom'
 */
function salvarGeneroCustom(nomeGenero) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ABA_GENER_CUSTOM);
    if (!sheet) return { success: false, message: 'Aba Generos_Custom não encontrada.' };
    
    sheet.appendRow([nomeGenero, new Date()]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * BUSCA LIVROS FILTRADOS COM STATUS 'Publicado' PARA A VITRINE DO LEITOR
 */
function buscarLivrosLeitor() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ABA_LIVROS);
    if (!sheet) return { livros: [] };
    
    const rows = sheet.getDataRange().getValues();
    let livrosPublicos = [];
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] === 'Publicado') {
        livrosPublicos.push({
          id: rows[i][0],
          titulo: rows[i][2],
          genero: rows[i][3],
          preco: rows[i][6],
          sinopse: rows[i][5]
        });
      }
    }
    return { livros: livrosPublicos };
  } catch(e) {
    return { livros: [] };
  }
}

/**
 * GRAVA O COMENTÁRIO NA ABA REAL 'Feedback' (SINGULAR)
 */
function gravarFeedback(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ABA_FEEDBACK);
    if (!sheet) return { success: false, message: 'Aba Feedback não encontrada.' };
    
    const idFeedback = 'FBK-' + Math.floor(100000 + Math.random() * 900000);
    sheet.appendRow([idFeedback, data.livroId, data.nota, data.texto, new Date()]);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * BUSCA COMENTÁRIOS DA SUA ABA REAL 'Feedback'
 */
function buscarFeedbacksDoLivro(livroId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_FEEDBACK);
    if (!sheet) return [];
    const rows = sheet.getDataRange().getValues();
    let filtrados = [];
    
    for(let i = 1; i < rows.length; i++) {
      if(rows[i][1].toString() === livroId.toString()) {
        filtrados.push({ nota: rows[i][2], texto: rows[i][3] });
      }
    }
    return filtrados;
  } catch(e) {
    return [];
  }
}
// Criptografia SHA-256 
function gerarHashSenha(senha) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, senha, Utilities.Charset.UTF_8);
  let output = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteValue = rawHash[i];
    if (byteValue < 0) byteValue += 256;
    let byteString = byteValue.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    output += byteString;
  }
  return output;
}

// ////////
function cadastrarUsuario(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Cadastro_Usuarios');
    
    if (!sheet) {
      return { success: false, message: 'Aba Cadastro_Usuarios não encontrada.' };
    }
    
    const rows = sheet.getDataRange().getValues();
  
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] && rows[i][4].toString().toLowerCase() === data.email.toLowerCase()) {
        return { success: false, message: 'Este e-mail já está cadastrado em nossa clareira.' };
      }
    }
    
    const idUnico = 'USR-' + Math.floor(100000 + Math.random() * 900000);
    const dataCriacao = new Date();
    const senhaCripto = gerarHashSenha(data.senha);
    

    sheet.appendRow([
      idUnico,
      dataCriacao,
      data.nome,
      data.nickname || data.nome.split(' ')[0].toLowerCase(),
      data.email,
      senhaCripto,
      data.tipo_usuario,
      'Escreva sua jornada aqui...',
      ''
    ]);
    

    if (data.tipo_usuario === 'Autor') {
      const metricSheet = ss.getSheetByName('Dashboard_Metricas');
      if (metricSheet) {
        metricSheet.appendRow([idUnico, 0, 0, 0, 5.0]);
      }
    }
    
    return {
      success: true,
      message: 'Sua linhagem foi escrita com sucesso na planilha!'
    };
  } catch (error) {
    return { success: false, message: 'Erro ao gravar no banco: ' + error.toString() };
  }
}


function loginUsuario(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cadastro_Usuarios');
    if (!sheet) return { success: false, message: 'Banco de dados inacessível.' };
    
    const rows = sheet.getDataRange().getValues();
    const hashLogin = gerarHashSenha(data.senha);
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] && rows[i][4].toString().toLowerCase() === data.email.toLowerCase() && rows[i][5].toString() === hashLogin) {
        return {
          success: true,
          user: {
            id: rows[i][0],
            nome: rows[i][2],
            nickname: rows[i][3],
            email: rows[i][4],
            tipo: rows[i][6],
            bio: rows[i][7],
            foto: rows[i][8]
          }
        };
      }
    }
    return { success: false, message: 'Credenciais incorretas na floresta.' };
  } catch (error) {
    return { success: false, message: 'Erro no servidor: ' + error.toString() };
  }
}


function buscarDadosDashboard(idAutor) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    

    const metricSheet = ss.getSheetByName('Dashboard_Metricas');
    let metricas = { visualizacoes: 0, vendas: 0, receita: 0, nota: 5.0 };
    
    if (metricSheet) {
      const metricRows = metricSheet.getDataRange().getValues();
      for (let i = 1; i < metricRows.length; i++) {
        if (metricRows[i][0] === idAutor) {
          metricas = {
            visualizacoes: Number(metricRows[i][1]),
            vendas: Number(metricRows[i][2]),
            receita: Number(metricRows[i][3]),
            nota: Number(metricRows[i][4])
          };
          break;
        }
      }
    }
    
 
    const livrosSheet = ss.getSheetByName('Livros');
    let meusLivros = [];
    
    if (livrosSheet) {
      const livrosRows = livrosSheet.getDataRange().getValues();
      for (let i = 1; i < livrosRows.length; i++) {
        if (livrosRows[i][1] === idAutor) {
          meusLivros.push({
            id: livrosRows[i][0],
            titulo: livrosRows[i][2],
            genero: livrosRows[i][3],
            status: livrosRows[i][4],
            preco: livrosRows[i][6]
          });
        }
      }
    }
    
    const atividade = [
      { texto: 'Conexão em tempo real estabelecida com o Sheets.', tempo: 'Agora' },
      { texto: 'Painel atualizado com base nas suas abas de dados.', tempo: 'Sincronizado' }
    ];
    
    return { success: true, metricas: metricas, livros: meusLivros, atividade: atividade };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}


function salvarPerfil(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cadastro_Usuarios');
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.id) {
        sheet.getRange(i + 1, 3).setValue(data.nome);
        sheet.getRange(i + 1, 4).setValue(data.nickname);
        sheet.getRange(i + 1, 8).setValue(data.bio);
        sheet.getRange(i + 1, 9).setValue(data.foto);
        return { success: true, message: 'Perfil sincronizado com as árvores do Fábulas!' };
      }
    }
    return { success: false, message: 'Usuário não encontrado.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}


function publicarLivro(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Livros');
    
    if (!sheet) return { success: false, message: 'Aba Livros não encontrada.' };
    
    const idLivro = 'BOK-' + Math.floor(100000 + Math.random() * 900000);
    
    sheet.appendRow([
      idLivro,
      data.id_autor,
      data.titulo,
      data.genero,
      data.status,
      data.sinopse,
      data.preco,
      new Date()
    ]);
    
    return { success: true, message: 'Sua história floresceu no catálogo do Fábulas!' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
