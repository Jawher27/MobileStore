const fs = require("fs");
const path = require("path");

const pageFile = path.join(__dirname, "app", "login", "page.tsx");
let pageContent = fs.readFileSync(pageFile, "utf-8");

const stateSearch = `  const [role, setRole] = useState<"client" | "supplier">("client");`;
const stateReplace = `  const [role, setRole] = useState<"client" | "supplier">("client");
  const [companyName, setCompanyName] = useState("");`;
pageContent = pageContent.replace(stateSearch, stateReplace);

const formDataSearch = `    if (!isLogin) {
      formData.set("role", role);
    }`;
const formDataReplace = `    if (!isLogin) {
      formData.set("role", role);
      if (role === "client") {
        formData.set("company_name", companyName);
      }
    }`;
pageContent = pageContent.replace(formDataSearch, formDataReplace);

const roleSelectEnd = `              </div>
            )}`;
const roleSelectEndReplace = `              </div>
            )}
            {!isLogin && role === "client" && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  required
                  placeholder="Ex: Auto Repair Mobile"
                  disabled={loading}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}`;
// Only replace the first occurrence (which is inside the form)
pageContent = pageContent.replace(roleSelectEnd, roleSelectEndReplace);
fs.writeFileSync(pageFile, pageContent, "utf-8");

const actionsFile = path.join(__dirname, "app", "login", "actions.ts");
let actionsContent = fs.readFileSync(actionsFile, "utf-8");

const signupVarsSearch = `  const role = (formData.get("role") as string) || "client";`;
const signupVarsReplace = `  const role = (formData.get("role") as string) || "client";
  const company_name = formData.get("company_name") as string;`;
actionsContent = actionsContent.replace(signupVarsSearch, signupVarsReplace);

const optionsDataSearch = `    options: {
      data: {
        role: role,
      },
    },`;
const optionsDataReplace = `    options: {
      data: {
        role: role,
        company_name: company_name,
      },
    },`;
actionsContent = actionsContent.replace(optionsDataSearch, optionsDataReplace);

fs.writeFileSync(actionsFile, actionsContent, "utf-8");
console.log("Login and actions updated successfully.");
