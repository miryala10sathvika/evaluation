import { Sample, Candidate } from "./types";

// Configuration matching your specific folder structure from ls -R
const FOLDERS = {
  GT_ROOT: 'ground_truth',
  // Exact folder names from your public directory
  CANDIDATES: ['model_A', 'model_B', 'model_C', 'model_D', 'model_E']
};

// File mapping based on your provided ls -R output.
// Models appear to be always .png, but GT varies (.png, .PNG, .jpg).
const DATASET_FILES = [
  { base: '23fa-cpsc490_canyough', gtExt: '.png' },
  { base: 'alanchn31_Movalytics-Data-Warehouse', gtExt: '.PNG' }, 
  { base: 'Azure_AzureStack-QuickStart-Templates', gtExt: '.png' },
  { base: 'azuregomez_SecurePaaS', gtExt: '.png' },
  { base: 'caraml-dev_turing', gtExt: '.png' },
  { base: 'chaitin_veinmind-tools', gtExt: '.png' },
  { base: 'DevOps-Represent_devopsgirls-bootcamp-cn-2', gtExt: '.png' },
  { base: 'ev2900_OpenSearch_Dashboard_Nginx_Proxy', gtExt: '.png' },
  { base: 'gaiax_fLibra', gtExt: '.png' },
  { base: 'GoogleCloudPlatform_analytics-componentized-patterns', gtExt: '.png' },
  { base: 'IBMDeveloperMEA_YPDL-Recurrent-Neural-Networks-using-TensorFlow-Keras', gtExt: '.png' },
  { base: 'input-output-hk_marlowe-starter-kit', gtExt: '.png' },
  { base: 'kzh_noob', gtExt: '.png' },
  { base: 'nrephi_jupyter-spark-hadoop-docker', gtExt: '.png' },
  { base: 'OAID_Tengine', gtExt: '.png' },
  { base: 'onlybakam_reinvent2022-vote-app', gtExt: '.png' },
  { base: 'opstree_OT-Microservices-Training', gtExt: '.png' },
  { base: 'redbadger_crux', gtExt: '.png' },
  { base: 'shinesolutions_sitechecker-slackbot', gtExt: '.jpg' },
  { base: 'WeBankFinTech_DeFiBus', gtExt: '.png' },
  { base: 'XenitAB_git-auth-proxy', gtExt: '.png' },
  { base: 'Xsidelight_flutter_interview_questions', gtExt: '.png' },
];

export const generateMockSamples = (): Sample[] => {
  const samples: Sample[] = [];

  DATASET_FILES.forEach((file, index) => {
    const id = index + 1;
    
    // 1. Construct Ground Truth Path with leading slash for public folder
    // This is crucial for Vite/web server to find files in the public directory
    const gtPath = `/${FOLDERS.GT_ROOT}/images/${file.base}${file.gtExt}`;

    const candidates: Candidate[] = [];
    
    // 2. Construct Candidate Paths with leading slash
    FOLDERS.CANDIDATES.forEach((folder, cIndex) => {
      const cId = cIndex + 1;
      
      // Models use .png based on file structure
      const imagePath = `/${folder}/images/${file.base}.png`;
      
      // JSON path: /model_A/jsons/filename_comparison.json
      const jsonPath = `/${folder}/jsons/${file.base}_comparison.json`;

      candidates.push({
        id: cId,
        imageUrl: imagePath,
        jsonUrl: jsonPath,
        label: `Model ${String.fromCharCode(65 + cIndex)}`, // Model A, Model B...
      });
    });

    samples.push({
      id: id,
      title: file.base.replace(/[-_]/g, ' '), // Make title readable
      groundTruthUrl: gtPath, 
      candidates: candidates,
    });
  });

  return samples;
};