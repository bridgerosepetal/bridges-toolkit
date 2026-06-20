import type { PageId } from "@shared/config/PageId";
import { ALL_PAGE_IDS, isPageId } from "@shared/config/PageId";

type CommandOutput = {
	text: string;
	level: "info" | "error";
};

type Context = {
	goToPage: (page: PageId) => void;
	closePlugin: () => void;
	clearConsole: () => void;
	toggleWindowSize: () => string;
};

type CommandResult = {
	outputs: Array<CommandOutput>;
	cleared: boolean;
};

type CommandHandler = (
	args: Array<string>,
	context: Context,
) => CommandResult;

export function executeConsoleCommand(
	command: string,
	context: Context,
): CommandResult {
	const trimmed = command.trim();
	if (trimmed.length === 0) {
		return { outputs: [], cleared: false };
	}

	const [name, ...args] = trimmed.split(/\s+/);
	const key = name.toLowerCase().replace(/\(\)$/, "");

	const handlers: Record<string, CommandHandler> = {
		help() {
			return {
				outputs: [
					{
						text: "Commands: help, page <id>, resize, close, clear",
						level: "info",
					},
				],
				cleared: false,
			};
		},
		page(commandArgs, commandContext) {
			const page = commandArgs[0];
			if (page === undefined || !isPageId(page)) {
				return {
					outputs: [
						{
							text: `Unknown page. Use: ${ALL_PAGE_IDS.join(" | ")}`,
							level: "error",
						},
					],
					cleared: false,
				};
			}
			commandContext.goToPage(page);
			return {
				outputs: [{ text: `Switched to page: ${page}`, level: "info" }],
				cleared: false,
			};
		},
		close(_, commandContext) {
			commandContext.closePlugin();
			return {
				outputs: [{ text: "Closing plugin...", level: "info" }],
				cleared: false,
			};
		},
		resize(_, commandContext) {
			const size = commandContext.toggleWindowSize();
			return {
				outputs: [{ text: `Window size: ${size}`, level: "info" }],
				cleared: false,
			};
		},
		clear(_, commandContext) {
			commandContext.clearConsole();
			return {
				outputs: [],
				cleared: true,
			};
		},
		bridge() {
			return {
				outputs: [
					{
						text: `
          'x|\`
        '|xx| \`          '|x|
\`   '    |xx|    \`   '    |x|\`
         |xx|             |x|
============|===============|===--
ejm ~~~~~|xx|~~~~~~~~~~~~~|x|~~~ ~~  ~   ~
`,
						level: "info",
					},
				],
				cleared: false,
			}
		},
		rose() {
			return {
				outputs: [
				{
					text: String.raw`
    _,--._.-,
   /\_r-,\_ )
.-.) _;='_/ (.;
 \ \'     \/S )
  L.'-. _.'|-'
 <_${'`'}-'\'_.'/
   ${'`'}'-._( \
    ___   \\,      ___
    \ .'-. \\   .-'_. /
     '._' '.\\/.-'_.'
        '--${'`'}${'`'}\('--'
        snd   \\
              ${'`'}\\,
                \|

`,
					level: "info",
				},
				],
				cleared: false,
			}
			}
	};

	const handler = handlers[key];
	if (handler === undefined) {
		return {
			outputs: [{ text: `Unknown command: ${name}`, level: "error" }],
			cleared: false,
		};
	}

	return handler(args, context);
}
