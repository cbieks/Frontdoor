import "dotenv/config";
import { classifyHtml } from "@/lib/scoring/heuristics";
import {
  AMBIGUOUS_NO_VIEWPORT_BUT_NO_LEGACY,
  MODERN_NEXTJS,
  OUTDATED_WP_TWENTYTWELVE,
} from "@/lib/scoring/heuristics.test-fixtures";

async function main() {
  console.log("─── MODERN_NEXTJS ───");
  console.log(JSON.stringify(classifyHtml(MODERN_NEXTJS, "https://modern.example"), null, 2));

  console.log("\n─── OUTDATED_WP_TWENTYTWELVE ───");
  console.log(
    JSON.stringify(
      classifyHtml(OUTDATED_WP_TWENTYTWELVE, "http://joesplumbing.example"),
      null,
      2
    )
  );

  console.log("\n─── AMBIGUOUS_NO_VIEWPORT_BUT_NO_LEGACY ───");
  console.log(
    JSON.stringify(
      classifyHtml(AMBIGUOUS_NO_VIEWPORT_BUT_NO_LEGACY, "https://acmesalon.example"),
      null,
      2
    )
  );
}

main();
