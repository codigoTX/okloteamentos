const fs = require('fs');
const path = require('path');

// Função para encontrar arquivos de forma recursiva
function findFilesRecursive(dir, pattern) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursivamente procura em subdiretórios
      results = results.concat(findFilesRecursive(filePath, pattern));
    } else if (pattern.test(file)) {
      // Adiciona arquivo se corresponder ao padrão
      results.push(filePath);
    }
  });
  
  return results;
}

// Encontra todos os arquivos .tsx no diretório src
const srcDir = path.join(__dirname, 'src');
const tsxFiles = findFilesRecursive(srcDir, /\.tsx$/);

// Mapeamento dos nomes incorretos para os nomes corretos na v1.0.6
const iconMappings = {
  'BarChart': 'ChartBarIcon',
  'Chart': 'ChartBarIcon',
  'Calendar': 'CalendarIcon',
  'Clock': 'ClockIcon',
  'Document': 'DocumentIcon',
  'Camera': 'CameraIcon',
  'Cash': 'CashIcon',
  'Chat': 'ChatIcon',
  'Check': 'CheckIcon',
  'CheckCircle': 'CheckCircleIcon',
  'Collection': 'CollectionIcon',
  'CreditCard': 'CreditCardIcon',
  'Database': 'DatabaseIcon',
  'DocumentAdd': 'DocumentAddIcon',
  'DocumentDownload': 'DocumentDownloadIcon',
  'Download': 'DownloadIcon',
  'ExclamationCircle': 'ExclamationCircleIcon',
  'Filter': 'FilterIcon',
  'Flag': 'FlagIcon',
  'Globe': 'GlobeIcon',
  'Heart': 'HeartIcon',
  'Home': 'HomeIcon',
  'InformationCircle': 'InformationCircleIcon',
  'Key': 'KeyIcon',
  'Link': 'LinkIcon',
  'LocationMarker': 'LocationMarkerIcon',
  'LockClosed': 'LockClosedIcon',
  'Login': 'LoginIcon',
  'Logout': 'LogoutIcon',
  'Mail': 'MailIcon',
  'Menu': 'MenuIcon',
  'MinusCircle': 'MinusCircleIcon',
  'Moon': 'MoonIcon',
  'Pencil': 'PencilIcon',
  'Phone': 'PhoneIcon',
  'Plus': 'PlusIcon',
  'PlusCircle': 'PlusCircleIcon',
  'Refresh': 'RefreshIcon',
  'Save': 'SaveIcon',
  'Search': 'SearchIcon',
  'Shield': 'ShieldCheckIcon',
  'Star': 'StarIcon',
  'Sun': 'SunIcon',
  'Tag': 'TagIcon',
  'Trash': 'TrashIcon',
  'Upload': 'UploadIcon',
  'User': 'UserIcon',
  'UserAdd': 'UserAddIcon',
  'UserCircle': 'UserCircleIcon',
  'Users': 'UsersIcon',
  'ViewList': 'ViewListIcon',
  'X': 'XIcon',
  'XCircle': 'XCircleIcon'
};

// Conta quantos arquivos foram modificados
let modifiedFiles = 0;

// Processa cada arquivo
tsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Verifica se o arquivo importa de @heroicons/react
  if (content.includes('@heroicons/react')) {
    // Para cada mapeamento, verifica e substitui
    Object.entries(iconMappings).forEach(([incorrect, correct]) => {
      // Padrão para encontrar importações incorretas
      // Por exemplo: import { BarChart } from '@heroicons/react/outline';
      const pattern = new RegExp(`import\\s+{[^}]*\\b${incorrect}\\b[^}]*}\\s+from\\s+['"]@heroicons/react/(outline|solid)['"]`, 'g');
      
      if (pattern.test(content)) {
        // Substitui a importação incorreta para a correta se não for a mesma
        if (incorrect !== correct) {
          content = content.replace(
            new RegExp(`\\b${incorrect}\\b(?=\\s*[,}]\\s*from\\s+['"]@heroicons/react/(outline|solid)['"])`, 'g'),
            `${correct} as ${incorrect}`
          );
          modified = true;
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
      console.log(`Corrigido: ${file}`);
    }
  }
});

console.log(`\nTotal de arquivos corrigidos: ${modifiedFiles}`);
