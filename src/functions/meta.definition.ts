import { Location, Position, Range, Uri } from "vscode";
import { isArrayLiteralExpression, isIdentifier, isStringLiteral, PropertyAssignment, StringLiteral, SyntaxKind } from "typescript";
import { NuxtTraverser } from "../nuxt/nuxt.traverser";
import { FunctionProvider } from "../types/function.provider";
import { FunctionResult } from "../types/function.result";
import { State } from "../types/state";
import { findAssignment } from "../utils/node";

export class MetaDefinitionProvider implements FunctionProvider {
  functions: string[] = ['definePageMeta'];
  traverser: NuxtTraverser = new NuxtTraverser();

  constructor(private state: State) {
  }

  async run(fn: FunctionResult): Promise<Location[] | undefined> {
    if (!this.state.nuxtProject) {
      return;
    }

    const assignment = findAssignment(fn.sourceFile, fn.offset);

    if (!assignment) {
      return;
    }

    const identifier = assignment.getChildren().find(i => isIdentifier(i));

    if (!identifier) {
      return;
    }

    if (identifier.text === 'layout') {
      return this.layout(fn, assignment);
    } else if (identifier.text === 'middleware') {
      return this.middleware(fn, assignment);
    }

    return;
  }

  layout(fn: FunctionResult, assignment: PropertyAssignment) : Location[] | undefined {
    const value = assignment.getChildren().find(i => isStringLiteral(i));

    if (!value) {
      return;
    }

    const key = value.text;
    
    const layouts = this.traverser.getAllLayouts(this.state.nuxtProject!);
    
    const layout = layouts.find(l => l.key === key);

    return layout ? [{
      uri: Uri.file(layout.path),
      range: new Range(new Position(0, 0), new Position(0, 0))
    }] : undefined;
  }

  middleware(fn: FunctionResult, assignment: PropertyAssignment) : Location[] | undefined {
    const singleValue = assignment.getChildren().find(c => isStringLiteral(c));

    let key: string;

    if (!singleValue) {
      const arrayValue = assignment.getChildren().find(c => isArrayLiteralExpression(c));

      if (arrayValue) {
        const e = arrayValue.elements.find(c => isStringLiteral(c) && c.text === fn.focusedText);

        if (e) {
          key = (<StringLiteral>e).text;
        } else {
          return;
        }
      } else {
        return;
      }
    } else {
      key = singleValue.text;
    }
    
    const middlewares = this.traverser.getAllMiddlewares(this.state.nuxtProject!);
    const middleware = middlewares.find(l => l.key === key);

    return middleware ? [{
      uri: Uri.file(middleware.path),
      range: new Range(new Position(0, 0), new Position(0, 0))
    }] : undefined;
  }


  dispose() {
  }
}