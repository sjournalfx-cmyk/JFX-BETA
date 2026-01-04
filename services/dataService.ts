
import { supabase } from '../lib/supabase';
import { Trade, Note, DailyBias, UserProfile, Goal } from '../types';

// Helper to map DB Trade to App Trade
const mapTradeFromDB = (dbTrade: any): Trade => ({
  ...dbTrade,
  assetType: dbTrade.asset_type,
  entryPrice: dbTrade.entry_price,
  exitPrice: dbTrade.exit_price,
  stopLoss: dbTrade.stop_loss,
  takeProfit: dbTrade.take_profit,
  planAdherence: dbTrade.plan_adherence,
  tradingMistake: dbTrade.trading_mistake,
  exitComment: dbTrade.exit_comment,
  beforeScreenshot: dbTrade.before_screenshot,
  afterScreenshot: dbTrade.after_screenshot,
});

// Helper to map App Trade to DB Trade
const mapTradeToDB = (trade: Trade, userId: string) => ({
  user_id: userId,
  pair: trade.pair,
  asset_type: trade.assetType,
  date: trade.date,
  time: trade.time,
  session: trade.session,
  direction: trade.direction,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  stop_loss: trade.stopLoss,
  take_profit: trade.takeProfit,
  lots: trade.lots,
  result: trade.result,
  pnl: trade.pnl,
  rr: trade.rr,
  rating: trade.rating,
  tags: trade.tags,
  notes: trade.notes,
  emotions: trade.emotions,
  plan_adherence: trade.planAdherence,
  trading_mistake: trade.tradingMistake,
  mindset: trade.mindset,
  exit_comment: trade.exitComment,
  before_screenshot: trade.beforeScreenshot,
  after_screenshot: trade.afterScreenshot,
});

const uploadImage = async (userId: string, imageSource: string | undefined, type: 'before' | 'after'): Promise<string | undefined> => {
  if (!imageSource || imageSource.startsWith('http')) return imageSource;

  try {
    // Convert base64 to Blob
    const response = await fetch(imageSource);
    const blob = await response.blob();
    
    const fileExt = 'png'; // Default to png for base64 transfers
    const fileName = `${userId}/${Date.now()}-${type}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('trade-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) {
      if (error.message === 'The resource was not found') {
        // Attempt to create bucket if it doesn't exist (might fail due to permissions)
        console.warn('trade-images bucket not found, please create it in Supabase dashboard');
      }
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('trade-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error(`Error uploading ${type} screenshot:`, err);
    return imageSource; // Fallback to base64 if upload fails
  }
};

const deleteImageFile = async (imageUrl: string | undefined) => {
  if (!imageUrl || !imageUrl.includes('trade-images')) return;

  try {
    // Extract path from public URL
    // URL format: .../storage/v1/object/public/trade-images/userId/filename.png
    const pathParts = imageUrl.split('trade-images/');
    if (pathParts.length < 2) return;
    
    const filePath = pathParts[1];
    
    const { error } = await supabase.storage
      .from('trade-images')
      .remove([filePath]);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting image file:', err);
  }
};

// Helper to map DB Goal to App Goal
const mapGoalFromDB = (dbGoal: any): Goal => ({
    id: dbGoal.id,
    title: dbGoal.title,
    description: dbGoal.description,
    type: dbGoal.type,
    metric: dbGoal.metric,
    targetValue: dbGoal.target_value,
    startValue: dbGoal.start_value,
    startDate: dbGoal.start_date,
    endDate: dbGoal.end_date,
    status: dbGoal.status,
    createdAt: dbGoal.created_at,
    milestones: dbGoal.milestones || [],
    manualProgress: dbGoal.current_value
});

export const dataService = {
  // --- Trades ---
  async getTrades() {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapTradeFromDB);
  },

  async addTrade(trade: Trade) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Upload images if they are base64
    const beforeUrl = await uploadImage(user.id, trade.beforeScreenshot, 'before');
    const afterUrl = await uploadImage(user.id, trade.afterScreenshot, 'after');

    const tradeWithUrls = {
      ...trade,
      beforeScreenshot: beforeUrl,
      afterScreenshot: afterUrl
    };

    const { data, error } = await supabase
      .from('trades')
      .insert(mapTradeToDB(tradeWithUrls, user.id))
      .select()
      .single();

    if (error) throw error;
    return mapTradeFromDB(data);
  },

  async updateTrade(trade: Trade) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current record to check for deleted images
    const { data: currentTrade } = await supabase
      .from('trades')
      .select('before_screenshot, after_screenshot')
      .eq('id', trade.id)
      .single();

    if (currentTrade) {
        // If it was a URL and now it's gone or changed to a base64, delete the old file
        if (currentTrade.before_screenshot && (!trade.beforeScreenshot || trade.beforeScreenshot.startsWith('data:'))) {
            await deleteImageFile(currentTrade.before_screenshot);
        }
        if (currentTrade.after_screenshot && (!trade.afterScreenshot || trade.afterScreenshot.startsWith('data:'))) {
            await deleteImageFile(currentTrade.after_screenshot);
        }
    }

    // Upload images if they are base64
    const beforeUrl = await uploadImage(user.id, trade.beforeScreenshot, 'before');
    const afterUrl = await uploadImage(user.id, trade.afterScreenshot, 'after');

    const tradeWithUrls = {
      ...trade,
      beforeScreenshot: beforeUrl,
      afterScreenshot: afterUrl
    };

    const { error } = await supabase
      .from('trades')
      .update(mapTradeToDB(tradeWithUrls, user.id))
      .eq('id', trade.id);

    if (error) throw error;
  },

  async deleteTrades(tradeIds: string[]) {
    const { error } = await supabase
      .from('trades')
      .delete()
      .in('id', tradeIds);

    if (error) throw error;
  },

  // --- Notes ---
  async getNotes() {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data.map((note: any) => ({
        ...note,
        isPinned: note.is_pinned
    }));
  },

  async addNote(note: Note) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notes')
      .insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
          date: note.date,
          tags: note.tags,
          color: note.color,
          is_pinned: note.isPinned
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, isPinned: data.is_pinned };
  },

  async updateNote(note: Note) {
    const { error } = await supabase
      .from('notes')
      .update({
          title: note.title,
          content: note.content,
          tags: note.tags,
          color: note.color,
          is_pinned: note.isPinned
      })
      .eq('id', note.id);

    if (error) throw error;
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // --- Daily Bias ---
  async getDailyBias() {
    const { data, error } = await supabase
      .from('daily_bias')
      .select('*');
      
    if (error) throw error;
    return data.map((bias: any) => ({
        ...bias,
        actualOutcome: bias.actual_outcome
    }));
  },

  async updateBias(bias: DailyBias) {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('User not authenticated');

     // Check if exists
     const { data: existing } = await supabase
        .from('daily_bias')
        .select('id')
        .eq('date', bias.date)
        .single();

     if (existing) {
         const { error } = await supabase
            .from('daily_bias')
            .update({
                bias: bias.bias,
                notes: bias.notes,
                actual_outcome: bias.actualOutcome
            })
            .eq('id', existing.id);
         if (error) throw error;
     } else {
         const { error } = await supabase
            .from('daily_bias')
            .insert({
                user_id: user.id,
                date: bias.date,
                bias: bias.bias,
                notes: bias.notes,
                actual_outcome: bias.actualOutcome
            });
         if (error) throw error;
     }
  },

  // --- Goals ---
  async getGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapGoalFromDB);
  },

  async addGoal(goal: Goal) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        metric: goal.metric,
        target_value: goal.targetValue,
        start_value: goal.startValue,
        current_value: goal.manualProgress || 0,
        start_date: goal.startDate,
        end_date: goal.endDate,
        status: goal.status,
        milestones: goal.milestones
      })
      .select()
      .single();

    if (error) throw error;
    return mapGoalFromDB(data);
  },

  async updateGoal(goal: Goal) {
    const { error } = await supabase
      .from('goals')
      .update({
        title: goal.title,
        description: goal.description,
        type: goal.type,
        metric: goal.metric,
        target_value: goal.targetValue,
        start_value: goal.startValue,
        current_value: goal.manualProgress,
        start_date: goal.startDate,
        end_date: goal.endDate,
        status: goal.status,
        milestones: goal.milestones
      })
      .eq('id', goal.id);

    if (error) throw error;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },

  // --- Profile ---
  async updateProfile(profile: Partial<UserProfile>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const dbProfile = {
          name: profile.name,
          country: profile.country,
          account_name: profile.accountName,
          initial_balance: profile.initialBalance,
          currency: profile.currency,
          currency_symbol: profile.currencySymbol,
          sync_method: profile.syncMethod,
          experience_level: profile.experienceLevel,
          trading_style: profile.tradingStyle,
          onboarded: profile.onboarded,
          plan: profile.plan
      };

      const { error } = await supabase
        .from('profiles')
        .update(dbProfile)
        .eq('id', user.id);
      
      if (error) throw error;
  }
};
