// Runtime connection requirements, independent of category and creation tools.
export const AI_GROUPS = [
 {key:'no-model',label:{ko:'모델 없이 사용',en:'No model needed'}},
 {key:'ai-supported',label:{ko:'AI 연결 지원',en:'AI connection supported'}},
 {key:'ai-required',label:{ko:'AI 연결 필수',en:'AI connection required'}}
];
export const aiKeys = s => ({none:['no-model'],optional:['no-model','ai-supported'],required:['ai-supported','ai-required']}[s.ai_connection] || []);
