class Plugin {
    constructor(workspace) {
        this.workspace = workspace;
        this.catName = 'BOTステータス';
    }

    async onload() {
        this.registerBlocks();
        console.log("CheckStatus Plugin loaded!");
    }

    async onunload() {
        this.unregisterBlocks();
        console.log("CheckStatus Plugin unloaded.");
    }

    registerBlocks() {
        if (typeof Blockly === 'undefined') return;

        const blocksInfo = [
            { id: 'status_cpu_usage', name: '💻 CPU使用率 (%)', py: 'psutil.cpu_percent(interval=0.1)' },
            { id: 'status_mem_used', name: '🧠 RAM使用量 (GiB)', py: 'psutil.virtual_memory().used / (1024 ** 3)' },
            { id: 'status_mem_total', name: '💾 RAM合計 (GiB)', py: 'psutil.virtual_memory().total / (1024 ** 3)' },
            { id: 'status_mem_percent', name: '📊 RAM使用率 (%)', py: 'psutil.virtual_memory().percent' },
            { id: 'status_ping', name: '📡 Ping (ms)', py: 'bot.latency * 1000' },
            { id: 'status_guild_count', name: '🏠 サーバー数', py: 'len(bot.guilds)' },
            { id: 'status_command_count', name: '🛠️ コマンド数', py: 'len(bot.tree.get_commands(guild=discord.Object(id=GUILD_ID)))' },
            { id: 'status_shard_count', name: '💎 Shard数', py: 'bot.shard_count or 1' },
            { id: 'status_uptime_current', name: '⏱️ 現稼働時間', py: 'str(datetime.now(timezone.utc) - getattr(bot, "start_time", datetime.now(timezone.utc))).split(".")[0]' }
        ];

        blocksInfo.forEach(info => {
            // 1. ブロック定義
            Blockly.Blocks[info.id] = {
                init: function () {
                    this.appendDummyInput().appendField(info.name);
                    this.setOutput(true, null);
                    this.setColour(230);
                    this.setTooltip(info.name + 'を取得します。');
                }
            };

            // 2. Pythonジェネレータ登録
            const generator = (block) => {
                // 自動インポートの確実な登録
                if (Blockly.Python) {
                    if (!Blockly.Python.definitions_) Blockly.Python.definitions_ = {};
                    Blockly.Python.definitions_['import_psutil'] = 'import psutil';
                    Blockly.Python.definitions_['import_discord'] = 'import discord';
                    Blockly.Python.definitions_['from_datetime_import_datetime_timezone'] = 'from datetime import datetime, timezone';
                }
                const order = (Blockly.Python && (Blockly.Python.ORDER_ATOMIC || Blockly.Python.ORDER_NONE)) || 0;
                return [info.py, order];
            };

            // EDBB環境に合わせて複数の登録方法を試行
            if (Blockly.Python) {
                if (Blockly.Python.forBlock) {
                    Blockly.Python.forBlock[info.id] = generator;
                }
                // フォールバック
                Blockly.Python[info.id] = generator;
            }
        });

        this.updateToolbox();
    }

    updateToolbox() {
        const toolbox = document.getElementById('toolbox');
        if (!toolbox) return;

        let category = toolbox.querySelector(`category[name="${this.catName}"]`);
        if (!category) {
            category = document.createElement('category');
            category.setAttribute('name', this.catName);
            category.setAttribute('data-icon', '📊');
            category.setAttribute('colour', '#4CAF50');
            toolbox.appendChild(category);
        }

        category.innerHTML = `
            <block type="status_cpu_usage"></block>
            <block type="status_mem_used"></block>
            <block type="status_mem_total"></block>
            <block type="status_mem_percent"></block>
            <block type="status_ping"></block>
            <block type="status_guild_count"></block>
            <block type="status_command_count"></block>
            <block type="status_shard_count"></block>
            <block type="status_uptime_current"></block>
        `;

        if (this.workspace && this.workspace.updateToolbox) {
            this.workspace.updateToolbox(toolbox);
        }
    }

    unregisterBlocks() {
        const toolbox = document.getElementById('toolbox');
        if (toolbox) {
            const category = toolbox.querySelector(`category[name="${this.catName}"]`);
            if (category) {
                category.remove();
                if (this.workspace && this.workspace.updateToolbox) {
                    this.workspace.updateToolbox(toolbox);
                }
            }
        }
    }
}