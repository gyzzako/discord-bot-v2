import { AutocompleteInteraction, ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";
import { LavalinkManager, Player } from "lavalink-client";
import ApiClient from "../api/client";

type InteractionExecuteFn = (client: BotClient, interaction: ChatInputCommandInteraction) => any;
type AutoCompleteExecuteFn = (client: BotClient, interaction: AutocompleteInteraction) => any;

export interface Command {
    data: SlashCommandBuilder;
    execute: InteractionExecuteFn;
    autocomplete?: AutoCompleteExecuteFn;
}

export interface Event {
    name: string,
    once?: boolean,
    execute: (client: BotClient, ...params: any) => any;
}

export interface BotClient extends Client {
    lavalink: LavalinkManager<Player>;
    apiClient: ApiClient;
    commands: Map<string, Command>;
}