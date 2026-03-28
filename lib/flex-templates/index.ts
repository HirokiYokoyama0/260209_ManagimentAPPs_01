import { birthdayCardTemplate } from "./birthday-card";

export interface FlexTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  variables: string[];
  category: string;
  template: any;
}

export const FLEX_TEMPLATES: FlexTemplate[] = [
  {
    id: "birthday-card",
    name: "誕生日カード",
    description: "お誕生日おめでとうメッセージと特別優待クーポン",
    emoji: "🎂",
    variables: ["name", "valid_until"],
    category: "celebration",
    template: birthdayCardTemplate,
  },
];

/**
 * テンプレートIDからテンプレートを取得
 */
export function getFlexTemplate(templateId: string): any | null {
  const found = FLEX_TEMPLATES.find((t) => t.id === templateId);
  return found ? found.template : null;
}

/**
 * クライアント側で使用するテンプレート一覧（templateは含まない）
 */
export function getFlexTemplateList() {
  return FLEX_TEMPLATES.map(({ template, ...rest }) => rest);
}
