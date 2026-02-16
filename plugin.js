class Plugin {
    constructor(workspace) {
        this.workspace = workspace;
    }

    async onload() {
        try {
            this.registerBlocks();
            this.applyCategory();
            console.log("CheckStatus Plugin loaded!");
        } catch (e) {
            console.error("CheckStatus Plugin onload error:", e);
        }
    }

    async onunload() {
        console.log("CheckStatus Plugin unloaded!");
    }

    registerBlocks() {
        const statusBlocks = [
            { id: 'status_cpu_usage', name: '💻 CPU使用率 (%)', py: 'psutil.cpu_percent(interval=0.1)' },
            { id: 'status_mem_used', name: '🧠 RAM使用量 (GiB)', py: 'psutil.virtual_memory().used / (1024 ** 3)' },
            { id: 'status_mem_total', name: '💾 RAM合計 (GiB)', py: 'psutil.virtual_memory().total / (1024 ** 3)' },
            { id: 'status_mem_percent', name: '📊 RAM使用率 (%)', py: 'psutil.virtual_memory().percent' },
            { id: 'status_ping', name: '📡 Ping (ms)', py: 'self.bot.latency * 1000' },
            { id: 'status_guild_count', name: '🏠 サーバー数', py: 'len(self.bot.guilds)' },
            { id: 'status_command_count', name: '🛠️ コマンド数', py: 'len(self.bot.tree.get_commands(guild=discord.Object(id=GUILD_ID)))' },
            { id: 'status_shard_count', name: '💎 Shard数', py: 'self.bot.shard_count or 1' },
            { id: 'status_uptime_current', name: '⏱️ 現稼働時間', py: 'str(datetime.now(timezone.utc) - getattr(self.bot, "start_time", datetime.now(timezone.utc))).split(".")[0]' },
            { id: 'status_uptime_total', name: '📊 累計稼働時間', py: 'f"{load_data().get(\'total_uptime_seconds\', 0) // 86400}日{(load_data().get(\'total_uptime_seconds\', 0) % 86400) // 3600}時間{(load_data().get(\'total_uptime_seconds\', 0) % 3600) // 60}分"' }
        ];

        statusBlocks.forEach(info => {
            // ブロック定義
            Blockly.Blocks[info.id] = {
                init: function () {
                    this.appendDummyInput().appendField(info.name);
                    this.setOutput(true, null);
                    this.setColour(230);
                    this.setTooltip(info.name + 'を取得します。');
                }
            };

            // Python生成ロジック (古い形式と新しい形式の両方に対応)
            const generator = function (block) {
                return [info.py, Blockly.Python.ORDER_ATOMIC || 0];
            };

            if (Blockly.Python.forBlock) {
                Blockly.Python.forBlock[info.id] = generator;
            } else {
                Blockly.Python[info.id] = generator;
            }
        });
    }

    applyCategory() {
        const workspace = this.workspace;
        let toolbox = workspace.options.languageTree;
        if (!toolbox) return;

        const catName = '📊 ステータス';
        const blockTypes = [
            'status_cpu_usage', 'status_mem_used', 'status_mem_total', 'status_mem_percent',
            'status_ping', 'status_guild_count', 'status_command_count', 'status_shard_count',
            'status_uptime_current', 'status_uptime_total'
        ];

        // XML
        if (typeof toolbox === 'string' || toolbox instanceof Element || toolbox instanceof Document) {
            if (typeof toolbox === 'string') {
                toolbox = new DOMParser().parseFromString(toolbox, 'text/xml').documentElement;
            }
            if (toolbox.querySelector(`category[name="${catName}"]`)) return;

            const newCat = document.createElement('category');
            newCat.setAttribute('name', catName);
            newCat.setAttribute('colour', '230');
            blockTypes.forEach(type => {
                const block = document.createElement('block');
                block.setAttribute('type', type);
                newCat.appendChild(block);
            });
            toolbox.appendChild(newCat);
            workspace.updateToolbox(toolbox);
        }
        // JSON
        else if (toolbox.contents) {
            if (toolbox.contents.find(c => c.name === catName)) return;
            toolbox.contents.push({
                kind: 'category',
                name: catName,
                colour: '230',
                contents: blockTypes.map(type => ({ kind: 'block', type: type }))
            });
            workspace.updateToolbox(toolbox);
        }
    }
}

// グローバルスコープに公開
window.Plugin = Plugin;